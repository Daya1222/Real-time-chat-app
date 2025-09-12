const mongoose = require("mongoose");
require("dotenv").config(); // Load .env variables

// Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
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
    status: { type: String, default: "sent" },
  },
  { timestamps: true }
);

// Models
const Users = mongoose.model("users", userSchema);
const Messages = mongoose.model("messages", messageSchema);

module.exports = { Users, Messages };
