import { getSocket } from "../components/socket";
import UserCard from "../components/userCard";
import "../css/home-page.css";
import { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { RefreshContext } from "../components/refreshContext";
import ChatBubble from "../components/chatBubble";

function Home() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const { refresh, setRefresh, globalUser } = useContext(RefreshContext);
  const [messages, setMessages] = useState([]);
  const chatWindowRef = useRef(null);
  const socket = getSocket({ token: localStorage.getItem("token") });

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [responseUsers, responseMessages] = await Promise.all([
          axios.get("http://localhost:3000/api/get-users", config),
          axios.get("http://localhost:3000/api/get-messages", config),
        ]);

        setUsers(responseUsers.data);
        setMessages(responseMessages.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
    fetchData();
  }, [refresh]);

  useEffect(() => {
    socket.on("messageSent", (msg) => {
      if (
        (msg.sender === globalUser.userName && msg.receiver === selectedUser) ||
        (msg.sender === selectedUser && msg.receiver === globalUser.userName)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("newRegistration", (newUser) => {
      console.log("New user registered:", newUser);
      setRefresh((prev) => !prev);
    });

    return () => {
      socket.off("newRegistration");
      socket.off("messageSent");
    };
  }, [setRefresh, selectedUser, globalUser.userName]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  function sendMessage() {
    if (!text.trim() || !selectedUser) return;

    const msg = {
      text: text.trim(),
      sender: globalUser.userName,
      receiver: selectedUser,
    };

    socket.emit("messageSent", msg);
    setText("");
  }

  if (!selectedUser) {
    return (
      <div className="home-page">
        <div className="user-list">
          {users
            .filter((user) => user.userName !== globalUser.userName)
            .map((user) => (
              <UserCard
                key={user._id}
                userName={user.userName}
                onClick={() => {
                  setRefresh((prev) => !prev);
                  setSelectedUser(user.userName);
                }}
              />
            ))}
        </div>
        <div className="select-chat-prompt">
          <h1>Select a user to chat.</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="user-list">
        {users
          .filter((user) => user.userName !== globalUser.userName)
          .map((user) => (
            <UserCard
              key={user._id}
              userName={user.userName}
              onClick={() =>
                setSelectedUser(
                  selectedUser === user.userName ? "" : user.userName
                )
              }
            />
          ))}
      </div>

      <div className="chat-window">
        <div className="chat-header">
          <div className="profile-Pic">
            <img alt="profilepic" className="profile-Pic" />
          </div>
          <div className="user-Name">{selectedUser}</div>
        </div>

        <div className="chatwindow" ref={chatWindowRef}>
          {messages
            .filter(
              (m) =>
                (m.sender === globalUser.userName &&
                  m.receiver === selectedUser) ||
                (m.sender === selectedUser &&
                  m.receiver === globalUser.userName)
            )
            .map((message) => (
              <ChatBubble
                key={message._id}
                text={message.text}
                sender={message.sender}
              />
            ))}
        </div>

        <div className="chatbox">
          <input
            type="text"
            placeholder="Type your message here."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="send" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
