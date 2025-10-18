import { getSocket } from "../components/socket";
import UserCard from "../components/userCard";
import ChatBubble from "../components/chatBubble";
import "../css/home-page.css";
import profilePic from "../assets/profile.png";
import { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { RefreshContext } from "../components/refreshContext";
import { useNavigate } from "react-router-dom";

function Home() {
  const [text, setText] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [messages, setMessages] = useState([]);
  const [ai, setAi] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const chatWindowRef = useRef(null);
  const socketRef = useRef(null);
  const listenerRegisteredRef = useRef(false);
  const messageSeenRef = useRef(new Set());
  const readReceiptsSentRef = useRef(new Set());

  const aiRef = useRef(ai);
  const globalUserRef = useRef(null);
  const selectedUserRef = useRef(selectedUser);

  const {
    users,
    setUsers,
    refresh,
    setRefresh,
    globalUser,
    onlineUsers,
    setOnlineUsers,
  } = useContext(RefreshContext);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("❌ No token found, redirecting to login");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    aiRef.current = ai;
  }, [ai]);

  useEffect(() => {
    globalUserRef.current = globalUser;
  }, [globalUser]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
    if (!selectedUser) {
      readReceiptsSentRef.current.clear();
      console.log("🧹 Cleared read receipts tracking");
    }
  }, [selectedUser]);

  if (!socketRef.current) {
    const token = localStorage.getItem("token");
    if (token) {
      console.log("🔌 CREATING NEW SOCKET INSTANCE");
      socketRef.current = getSocket({ token });
    }
  }
  const socket = socketRef.current;

  useEffect(() => {
    if (!window.puter) {
      const script = document.createElement("script");
      script.src = "https://js.puter.com/v2/";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("❌ No token for fetching data");
          navigate("/");
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [userRes, msgRes] = await Promise.all([
          axios.get("/api/get-users", config),
          axios.get("/api/get-messages", config),
        ]);

        setUsers(userRes.data);
        setMessages(msgRes.data);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        if (err.response?.status === 401) {
          console.log("❌ Token expired or invalid, redirecting to login");
          localStorage.removeItem("token");
          navigate("/");
        }
      }
    }

    fetchData();
  }, [refresh, setUsers, navigate]);

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

  function showNotification(title, options = {}) {
    if (Notification.permission === "granted") {
      new Notification(title, options);
    }
  }

  useEffect(() => {
    if (!socket) {
      console.log("! No socket available yet");
      return;
    }

    if (listenerRegisteredRef.current) {
      console.log("! BLOCKED: Tried to register listeners again!");
      return;
    }

    console.log("🔌 REGISTERING SOCKET LISTENERS (FIRST TIME ONLY)");
    listenerRegisteredRef.current = true;

    function handleMessageStatus(updatedMsg) {
      const msgId = updatedMsg._id;
      const alreadySeen = messageSeenRef.current.has(msgId);

      setMessages((prev) => {
        const exists = prev.find((m) => m._id === msgId);

        if (exists) {
          // Message exists - this is a STATUS UPDATE (delivered/read)
          console.log(`📝 Status update: ${msgId} → ${updatedMsg.status}`);
          return prev.map((m) =>
            m._id === msgId ? { ...m, status: updatedMsg.status } : m,
          );
        } else if (alreadySeen) {
          // New message but already processed - TRUE DUPLICATE
          console.log(`! DUPLICATE BLOCKED: ${msgId} - Already processed!`);
          return prev;
        } else {
          // Brand new message
          console.log(`✅ NEW MESSAGE: ${msgId} from ${updatedMsg.sender}`);
          messageSeenRef.current.add(msgId);
          const currentGlobalUser = globalUserRef.current;
          const currentSelectedUser = selectedUserRef.current;

          if (
            updatedMsg.sender !== currentGlobalUser?.userName &&
            updatedMsg.sender !== currentSelectedUser
          ) {
            showNotification(`New Message from ${updatedMsg.sender}`, {
              body: updatedMsg.text,
              icon: profilePic,
            });
          }
          return [...prev, updatedMsg];
        }
      });

      const currentGlobalUser = globalUserRef.current;
      if (
        updatedMsg.sender !== currentGlobalUser?.userName &&
        updatedMsg.status === "sent"
      ) {
        socket.emit("messageDelivered", {
          _id: msgId,
          senderName: updatedMsg.sender,
        });
      }

      const isAiActive = aiRef.current;
      const currentUser = globalUserRef.current;

      if (
        isAiActive &&
        updatedMsg.sender !== currentUser?.userName &&
        updatedMsg.receiver === currentUser?.userName
      ) {
        console.log(`🤖 AI will respond to: ${msgId}`);
        setAiLoading(true);

        (async () => {
          try {
            if (!window.puter) {
              console.error("❌ Puter SDK not loaded yet");
              setAiLoading(false);
              return;
            }

            const systemPrompt =
              "You are a helpful, witty assistant who replies naturally and concisely. Keep responses very short (1-2 sentences max).";
            const userMessage = updatedMsg.text;

            console.log(`🤖 Calling Puter AI for: "${userMessage}"`);

            const response = await window.puter.ai.chat(
              `${systemPrompt}\n\nUser: ${userMessage}`,
              {
                model: "gpt-4o-mini",
              },
            );

            let aiText;

            if (response?.message?.content) {
              const content = response.message.content;

              if (typeof content === "string") {
                aiText = content;
              } else if (Array.isArray(content)) {
                aiText = content
                  .filter((item) => item.type === "text")
                  .map((item) => item.text)
                  .join(" ")
                  .trim();
              } else {
                aiText = String(content);
              }
            } else if (typeof response === "string") {
              aiText = response;
            } else if (Array.isArray(response)) {
              aiText = response
                .filter((item) => item.type === "text")
                .map((item) => item.text)
                .join(" ")
                .trim();
            } else {
              aiText = "Sorry, I couldn't process that.";
            }

            if (!aiText || aiText.length === 0) {
              aiText = "Sorry, I couldn't generate a response.";
            }

            if (aiText.length > 1000) {
              aiText = aiText.substring(0, 997) + "...";
            }

            console.log(`🤖 AI Response: "${aiText}"`);
            console.log(
              `🤖 Sending AI response from ${currentUser?.userName} to ${updatedMsg.sender}`,
            );

            socket.emit("messageSent", {
              text: aiText,
              sender: currentUser?.userName,
              receiver: updatedMsg.sender,
            });
          } catch (err) {
            console.error("❌ AI error:", err);
            socket.emit("messageSent", {
              text: "Sorry, I encountered an error processing that message.",
              sender: currentUser?.userName,
              receiver: updatedMsg.sender,
            });
          } finally {
            setAiLoading(false);
            console.log(`✅ AI done`);
          }
        })();
      }
    }

    function handleNewRegistration(newUser) {
      console.log("👤 New registration:", newUser);
      setRefresh((prev) => !prev);
    }

    function handleOnlineUsers(onlineList) {
      console.log("👥 Online users updated:", onlineList);
      setOnlineUsers(onlineList);
    }

    function handleForceLogout(data) {
      alert(data.msg);
      localStorage.removeItem("token");
      navigate("/");
    }

    socket.removeAllListeners("messageStatus");
    socket.removeAllListeners("newRegistration");
    socket.removeAllListeners("onlineUsers");
    socket.removeAllListeners("forceLogout");

    socket.on("messageStatus", handleMessageStatus);
    socket.on("newRegistration", handleNewRegistration);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("forceLogout", handleForceLogout);

    console.log("✅ Listeners registered successfully");

    return () => {
      console.log("🧹 CLEANUP: Component unmounting, removing listeners");
      socket.off("messageStatus", handleMessageStatus);
      socket.off("newRegistration", handleNewRegistration);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("forceLogout", handleForceLogout);
    };
  }, [socket, navigate, setRefresh, setOnlineUsers]);

  useEffect(() => {
    if (!selectedUser || !globalUser) return;

    const unreadMessages = messages.filter((msg) => {
      return (
        msg.sender === selectedUser &&
        msg.status !== "read" &&
        !readReceiptsSentRef.current.has(msg._id)
      );
    });

    if (unreadMessages.length > 0) {
      console.log(
        `📖 Marking ${unreadMessages.length} messages as read for ${selectedUser}`,
      );

      unreadMessages.forEach((msg) => {
        readReceiptsSentRef.current.add(msg._id);

        socket.emit("messageRead", {
          _id: msg._id,
          senderId: msg.senderId,
        });

        console.log(`✅ Read receipt sent for message ${msg._id}`);
      });
    }
  }, [selectedUser, messages, socket, globalUser]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!text.trim() || !selectedUser) return;

    const userMessage = text.trim();
    const msg = {
      text: userMessage,
      sender: globalUser.userName,
      receiver: selectedUser,
    };

    console.log("📤 Sending message:", msg);
    socket.emit("messageSent", msg);
    setText("");
  }

  const lastMessagesMap = messages.reduce((acc, msg) => {
    const otherUser =
      msg.sender === globalUser?.userName ? msg.receiver : msg.sender;
    if (
      !acc[otherUser] ||
      new Date(msg.createdAt) > new Date(acc[otherUser].createdAt)
    ) {
      acc[otherUser] = msg;
    }
    return acc;
  }, {});

  if (!selectedUser) {
    const showableUsers = users.filter(
      (u) => u.userName !== globalUser?.userName,
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
                  (m.sender === globalUser?.userName &&
                    m.receiver === selectedUser) ||
                  (m.sender === selectedUser &&
                    m.receiver === globalUser?.userName),
              )
              .map((message) => (
                <ChatBubble
                  key={message._id}
                  text={message.text}
                  sender={message.sender}
                  msgStatus={message.status}
                />
              ))}
            {aiLoading && (
              <div
                style={{
                  padding: "12px 16px",
                  textAlign: "center",
                  color: "#4CAF50",
                  fontStyle: "italic",
                  background: "rgba(76, 175, 80, 0.05)",
                  borderRadius: "8px",
                  margin: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "20px" }}>🤖</span>
                <span>AI is thinking and responding...</span>
              </div>
            )}
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
            disabled={aiLoading}
          />
          <button
            className="ai-button"
            onClick={() => {
              const newAiState = !ai;
              console.log(`🎚 AI toggled: ${newAiState ? "ON" : "OFF"}`);
              setAi(newAiState);
            }}
            style={{
              background: ai
                ? "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)"
                : "linear-gradient(135deg, #888 0%, #666 100%)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              fontWeight: "600",
              marginRight: "10px",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              boxShadow: ai
                ? "0 2px 12px rgba(76, 175, 80, 0.4)"
                : "0 2px 8px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              opacity: aiLoading ? 0.6 : 1,
              cursor: aiLoading ? "not-allowed" : "pointer",
              border: ai ? "2px solid #4CAF50" : "2px solid transparent",
            }}
            disabled={aiLoading}
          >
            {ai ? "🤖 AI ON" : "AI OFF"}
          </button>
          <button
            className="send-button"
            onClick={sendMessage}
            disabled={aiLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
