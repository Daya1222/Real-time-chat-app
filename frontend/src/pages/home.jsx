import { getSocket } from "../components/socket";
import UserCard from "../components/userCard";
import ChatBubble from "../components/chatBubble";
import "../css/home-page.css";
import profilePic from "../assets/profile.png";
import { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { RefreshContext } from "../components/refreshContext";
import { Navigate, useNavigate } from "react-router-dom";

function Home() {
  const [text, setText] = useState(""); // input box text
  const [selectedUser, setSelectedUser] = useState(""); // chat target
  const [messages, setMessages] = useState([]); // current chat messages

  const chatWindowRef = useRef(null); // scrollable chat window

  const {
    users,
    setUsers,
    refresh,
    setRefresh,
    globalUser,
    onlineUsers,
    setOnlineUsers,
  } = useContext(RefreshContext);

  const socket = getSocket({ token: localStorage.getItem("token") });
  const navigate = useNavigate();

  // fetch initial users and messages
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [userRes, msgRes] = await Promise.all([
          axios.get("/api/get-users", config),
          axios.get("/api/get-messages", config),
        ]);

        setUsers(userRes.data);
        setMessages(msgRes.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    }

    fetchData();
  }, [refresh]);

  // Request notification permission
  useEffect(() => {
    function requestNotificationPermission() {
      if (!("Notification" in window)) {
        console.warn("This browser does not support notifications.");
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            console.log("Notification permission granted!");
          } else {
            console.log("Notification permission denied");
          }
        });
      }
    }
    requestNotificationPermission();
  }, []);

  // Show notification
  function showNotification(title, options = {}) {
    if (Notification.permission === "granted") {
      new Notification(title, options);
    }
  }

  //socket listeners
  useEffect(() => {
    socket.on("messageStatus", (updatedMsg) => {
      setMessages((prev) => {
        const exists = prev.find((m) => m._id === updatedMsg._id);
        if (exists) {
          return prev.map((m) =>
            m._id === updatedMsg._id ? { ...m, status: updatedMsg.status } : m
          );
        } else {
          if (
            updatedMsg.sender !== globalUser.userName &&
            updatedMsg.sender !== selectedUser
          ) {
            showNotification(`New Message from ${updatedMsg.sender}`, {
              body: updatedMsg.text,
              icon: profilePic,
            });
          }
          return [...prev, updatedMsg];
        }
      });

      if (
        updatedMsg.sender !== globalUser.userName &&
        updatedMsg.status === "sent"
      ) {
        socket.emit("messageDelivered", {
          _id: updatedMsg._id,
          senderName: updatedMsg.sender,
        });
      }
    });

    socket.on("newRegistration", (newUser) => setRefresh((prev) => !prev));
    socket.on("onlineUsers", (onlineList) => setOnlineUsers(onlineList));
    socket.on("forceLogout", (data) => {
      alert(data.msg);
      localStorage.removeItem("token");
      navigate("/");
    });

    return () => {
      socket.off("messageStatus");
      socket.off("newRegistration");
      socket.off("onlineUsers");
      socket.off("forceLogout");
    };
  }, [
    selectedUser,
    globalUser.userName,
    setRefresh,
    setOnlineUsers,
    navigate,
    socket,
  ]);

  useEffect(() => {
    if (!selectedUser) return;

    const unreadMessages = messages.filter((msg) => {
      return msg.sender === selectedUser && msg.status !== "read";
    });

    unreadMessages.forEach((msg) => {
      socket.emit("messageRead", {
        _id: msg._id,
        senderId: msg.senderId,
      });
    });
  }, [selectedUser, messages, socket]);

  // auto-scroll chat window
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // send a chat message
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

  // get the last message with a specific user

  const lastMessagesMap = messages.reduce((acc, msg) => {
    const otherUser =
      msg.sender === globalUser.userName ? msg.receiver : msg.sender;
    if (
      !acc[otherUser] ||
      new Date(msg.createdAt) > new Date(acc[otherUser].createdAt)
    ) {
      acc[otherUser] = msg;
    }
    return acc;
  }, {});

  // show user list if no chat selected
  if (!selectedUser) {
    const showableUsers = users.filter(
      (u) => u.userName !== globalUser.userName
    );

    return (
      <div className="home-page-list">
        <div className="user-list-only">
          {showableUsers.length > 0 ? (
            showableUsers.map((user) => (
              <UserCard
                key={user._id}
                userName={user.userName}
                profilePic={profilePic}
                lastMessage={lastMessagesMap[user.userName]?.text || ""}
                status={onlineUsers.includes(user.userName)}
                onClick={() => {
                  setRefresh((prev) => !prev);
                  setSelectedUser(user.userName);
                }}
              />
            ))
          ) : (
            <div
              style={{ textAlign: "center", marginTop: "20px", fontSize: 20 }}
            >
              No other users.
            </div>
          )}
        </div>
      </div>
    );
  }

  // chat window
  return (
    <div className="home-page">
      <div className="chat-window">
        <div className="chat-header">
          <div className="profile-Pic">
            <img
              src={profilePic}
              alt="profilepic"
              className={`pic ${
                onlineUsers.includes(selectedUser) ? "online-ring" : ""
              }`}
            />
          </div>
          <div className="user-name">{selectedUser}</div>
          <button className="exit-button" onClick={() => setSelectedUser("")}>
            X
          </button>
        </div>

        <div className="chatwindow">
          <div className="messages" ref={chatWindowRef}>
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
                  msgStatus={message.status}
                />
              ))}
          </div>
        </div>

        <div className="chat-box">
          <input
            className="input-box"
            type="text"
            placeholder="Type your message here."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button className="send-button" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
