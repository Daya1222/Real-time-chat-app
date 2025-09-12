const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
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

// Track online users: { username: socketId }
const connectedUsers = {};

// socket.io setup
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" },
});

// socket authentication
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

// socket connection
io.on("connection", (socket) => {
  const userName = socket.user.userName;

  // add user to connected list
  connectedUsers[userName] = socket.id;
  console.log("user connected", socket.id, userName);

  // notify everyone of online users
  emitOnlineUsers();

  // handle sending messages
  socket.on("messageSent", async (msg) => {
    if (!msg || !msg.text) return;

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
        receiver: msg.receiver,
        createdAt: savedMessage.createdAt,
      };

      // send to sender
      io.to(socket.id).emit("messageSent", messageToEmit);

      // send to receiver if online
      const receiverId = connectedUsers[msg.receiver];
      if (receiverId) io.to(receiverId).emit("messageSent", messageToEmit);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // handle disconnect
  socket.on("disconnect", () => {
    delete connectedUsers[userName];
    console.log("user disconnected", socket.id, userName);

    // notify everyone of updated online users
    emitOnlineUsers();
  });
});

// middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// login/register
app.post("/login", login);
app.post("/register", register, (req, res) => {
  // notify everyone about new user
  io.emit("newRegistration", req.user.userName);
  res.status(200).json({ msg: "User successfully created." });
});

// admin verify
app.post("/api/verify-admin", isAdmin, (req, res) => {
  res.status(200).json({ msg: "Admin verified successfully." });
});

// get users
app.get("/api/get-users", authorize, async (req, res) => {
  try {
    const users = await Users.find().select("_id userName email role");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// get messages
app.get("/api/get-messages", authorize, async (req, res) => {
  try {
    const userName = req.user.userName;
    const messages = await Messages.find({
      $or: [{ sender: userName }, { receiver: userName }],
    });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// delete user (admin only)
app.post("/api/delete-user", isAdmin, async (req, res) => {
  try {
    const user = await Users.findOne({ userName: req.body.userName });
    if (!user) return res.status(404).json({ msg: "User not found." });

    // emit a custom 'forceLogout' event if user is online
    const socketId = connectedUsers[user.userName];
    if (socketId) {
      io.to(socketId).emit("forceLogout", {
        msg: "Your account has been deleted. You will be logged out.",
      });
    }

    // delete user and messages
    await Users.deleteOne({ _id: user._id });
    await Messages.deleteMany({
      $or: [{ sender: user.userName }, { receiver: user.userName }],
    });

    // remove from connected users from array
    if (socketId) delete connectedUsers[user.userName];

    res.status(200).json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// start server
const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
