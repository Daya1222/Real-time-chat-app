const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const {
  login,
  authorize,
  register,
  adminOnly,
  isAdmin,
  isAuthorized,
} = require("./auth.js");
const cors = require("cors");
const { Messages, Users } = require("./models.js");

const app = express();
const httpServer = createServer(app);
const connectedUsers = {};

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const tokenData = isAuthorized(token);
  if (tokenData.status) {
    socket.user = tokenData.user;
    next();
  } else {
    return next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("user connected", socket.id, socket.user.userName);
  const userName = socket.user.userName;
  connectedUsers[userName] = socket.id;

  socket.on("messageSent", async (msg) => {
    if (!msg || !msg.text) return;

    try {
      const savedMessage = await Messages.create({
        text: msg.text,
        sender: socket.user.userName,
        receiver: msg.receiver,
      });

      const messageToEmit = {
        _id: savedMessage._id,
        text: msg.text,
        sender: socket.user.userName,
        receiver: msg.receiver,
        createdAt: savedMessage.createdAt,
      };

      const receiverId = connectedUsers[msg.receiver];

      io.to(socket.id).emit("messageSent", messageToEmit);

      if (receiverId) io.to(receiverId).emit("messageSent", messageToEmit);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    delete connectedUsers[userName];
    console.log("user disconnected", socket.id, socket.user.userName);
  });
});

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

//Login/register
app.post("/login", login);
app.post("/register", register, (req, res) => {
  io.emit("newRegistration", req.user.userName);

  res.status(200).json({ msg: "User successfully created." });
});

//provide userlist
app.get("/api/get-users", authorize, async (req, res) => {
  const users = await Users.find().select("_id userName email isActive role");
  res.status(200).json(users);
});

//provide messages
app.get("/api/get-messages", authorize, async (req, res) => {
  const userName = req.user.userName;
  const reqMessages = await Messages.find({
    $or: [{ sender: userName }, { receiver: userName }],
  });

  res.status(200).json(reqMessages);
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
