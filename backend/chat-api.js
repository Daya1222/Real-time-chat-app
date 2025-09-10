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

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  console.log(token);
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

  socket.on("messageSent", async (msg) => {
    await Messages.create({
      text: msg.text,
      sender: socket.user.id,
      receiver: msg.receiver,
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id, socket.user.userName);
  });
});

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

//Login/register
app.post("/login", login);
app.post("/register", register);

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
