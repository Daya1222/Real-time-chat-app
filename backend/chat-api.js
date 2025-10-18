const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const {
    login,
    authorize,
    register,
    isAdmin,
    isAuthorized,
} = require("./auth.js");
const { Messages, Users } = require("./models.js");

const app = express();
const httpServer = createServer(app);

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Determine allowed origins
const allowedOrigins =
    NODE_ENV === "production"
        ? [
              process.env.FRONTEND_URL,
              `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`,
          ].filter(Boolean)
        : ["http://localhost:5173", "http://localhost:3000"];

// Track online users: { username: socketId }
const connectedUsers = {};

// Socket.io setup with dynamic CORS
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
});

// Middleware
app.use(express.json());
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);

            if (
                allowedOrigins.includes(origin) ||
                allowedOrigins.includes("*")
            ) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    }),
);

// Socket authentication
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const tokenData = isAuthorized(token);
    if (tokenData.status) {
        socket.user = tokenData.user;
        next();
    } else {
        next(new Error("Authentication error"));
    }
});

// Helper: emit the list of online users to everyone
function emitOnlineUsers() {
    io.emit("onlineUsers", Object.keys(connectedUsers));
}

// Socket connection
io.on("connection", async (socket) => {
    const userName = socket.user.userName;

    // Add user to connected list
    connectedUsers[userName] = socket.id;
    console.log("✅ User connected:", socket.id, userName);

    // Notify everyone of online users
    emitOnlineUsers();

    // === Send undelivered messages if any ===
    try {
        const undeliveredMessages = await Messages.find({
            receiver: userName,
            status: "sent",
        });

        console.log(
            `📬 Sending ${undeliveredMessages.length} undelivered messages to ${userName}`,
        );

        for (const msg of undeliveredMessages) {
            // Send to recipient with delivered status
            socket.emit("messageStatus", {
                ...msg.toObject(),
                status: "delivered",
            });

            // Mark as delivered in DB
            await Messages.updateOne({ _id: msg._id }, { status: "delivered" });

            // Notify sender if online AND different socket
            const senderSocketId = connectedUsers[msg.sender];
            if (senderSocketId && senderSocketId !== socket.id) {
                io.to(senderSocketId).emit("messageStatus", {
                    _id: msg._id,
                    status: "delivered",
                });
            }
        }
    } catch (err) {
        console.error("❌ Error sending undelivered messages:", err);
    }

    // Handle message delivered confirmation
    socket.on("messageDelivered", async ({ _id, senderName }) => {
        try {
            await Messages.updateOne({ _id }, { status: "delivered" });
            const senderSocketId = connectedUsers[senderName];

            // Only notify sender if it's a different socket
            if (senderSocketId && senderSocketId !== socket.id) {
                io.to(senderSocketId).emit("messageStatus", {
                    _id,
                    status: "delivered",
                });
                console.log(`📨 Delivered: ${senderName} (${_id.slice(-6)})`);
            }
        } catch (err) {
            console.error("❌ Error updating delivered status:", err);
        }
    });

    // Handle message read confirmation
    socket.on("messageRead", async ({ _id, senderId }) => {
        try {
            // First check current status to avoid unnecessary updates
            const message = await Messages.findById(_id);

            if (!message) {
                console.log(`! Message ${_id} not found`);
                return;
            }

            // Skip if already marked as read (NO LOG - this is expected)
            if (message.status === "read") {
                return;
            }

            // Update to read
            await Messages.updateOne({ _id }, { status: "read" });

            const senderSocketId = connectedUsers[message.sender];

            // Only notify sender if it's a different socket
            if (senderSocketId && senderSocketId !== socket.id) {
                io.to(senderSocketId).emit("messageStatus", {
                    _id,
                    status: "read",
                });
                console.log(
                    `📖 Read receipt: ${message.sender} ← ${message.receiver} (${_id.slice(-6)})`,
                );
            }
        } catch (err) {
            console.error("❌ Error marking message as read:", err);
        }
    });

    // Handle sending messages
    socket.on("messageSent", async (msg) => {
        if (!msg || !msg.text) {
            console.log("! Empty message received, ignoring");
            return;
        }

        try {
            const savedMessage = await Messages.create({
                text: msg.text,
                sender: userName,
                receiver: msg.receiver,
            });

            const messageToEmit = {
                _id: savedMessage._id,
                text: msg.text,
                sender: userName,
                senderId: socket.id,
                receiver: msg.receiver,
                createdAt: savedMessage.createdAt,
                status: "sent",
            };

            // Get receiver socket ID
            const receiverId = connectedUsers[msg.receiver];

            // Log concisely
            const msgPreview =
                msg.text.length > 30
                    ? msg.text.substring(0, 30) + "..."
                    : msg.text;
            const receiverStatus = receiverId
                ? receiverId === socket.id
                    ? "self"
                    : "online"
                : "offline";
            console.log(
                `💬 ${userName} → ${msg.receiver} [${receiverStatus}]: "${msgPreview}"`,
            );

            // IMPORTANT: Only send to sender ONCE
            socket.emit("messageStatus", messageToEmit);

            // Send to receiver if online AND different from sender
            if (receiverId && receiverId !== socket.id) {
                io.to(receiverId).emit("messageStatus", {
                    ...messageToEmit,
                    status: "sent",
                });
            }
        } catch (error) {
            console.error("❌ Error saving message:", error);
            socket.emit("messageError", {
                error: "Failed to send message",
            });
        }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
        delete connectedUsers[userName];
        console.log("👋 User disconnected:", socket.id, userName);

        // Notify everyone of updated online users
        emitOnlineUsers();
    });
});

// ============ API Routes ============

// Login/Register
app.post("/login", login);

app.post("/register", register, (req, res) => {
    // Notify everyone about new user
    io.emit("newRegistration", req.user.userName);
    res.status(200).json({ msg: "User successfully created." });
});

// Admin verify
app.post("/api/verify-admin", isAdmin, (req, res) => {
    res.status(200).json({ msg: "Admin verified successfully." });
});

// Get users
app.get("/api/get-users", authorize, async (req, res) => {
    try {
        const users = await Users.find().select("_id userName email role");
        res.status(200).json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Get messages
app.get("/api/get-messages", authorize, async (req, res) => {
    try {
        const userName = req.user.userName;
        const messages = await Messages.find({
            $or: [{ sender: userName }, { receiver: userName }],
        });
        res.status(200).json(messages);
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Delete user (admin only)
app.post("/api/delete-user", isAdmin, async (req, res) => {
    try {
        const user = await Users.findOne({ userName: req.body.userName });
        if (!user) return res.status(404).json({ msg: "User not found." });

        // Emit a custom 'forceLogout' event if user is online
        const socketId = connectedUsers[user.userName];
        if (socketId) {
            io.to(socketId).emit("forceLogout", {
                msg: "Your account has been deleted. You will be logged out.",
            });
        }

        // Delete user and messages
        await Users.deleteOne({ _id: user._id });
        await Messages.deleteMany({
            $or: [{ sender: user.userName }, { receiver: user.userName }],
        });

        // Remove from connected users
        if (socketId) delete connectedUsers[user.userName];

        res.status(200).json({ msg: "User deleted" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ msg: "Server error" });
    }
});

// Health check endpoint (useful for Render)
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============ Serve Frontend ============

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Fallback to index.html for SPA routing (must be last)
app.get(/^(?!.*\.(js|css|png|jpg|jpeg|gif|svg|ico|json)).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

// ============ Start Server ============

httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`
    🚀 Server is running!
    📡 Port: ${PORT}
    🌍 Environment: ${NODE_ENV}
    ${NODE_ENV === "production" ? `🔗 Frontend URL: ${process.env.FRONTEND_URL || "Not set"}` : ""}
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    httpServer.close(() => {
        console.log("HTTP server closed");
    });
});
