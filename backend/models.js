const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/chat");

const userSchema = mongoose.Schema(
  {
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    role: { type: String, default: "user" },
  },
  { timestamps: true }
);
const messageSchema = mongoose.Schema(
  {
    text: { type: String, required: true },
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    readSratus: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Users = mongoose.model("users", userSchema);
const Messages = mongoose.model("messages", messageSchema);

module.exports = { Users, Messages };
