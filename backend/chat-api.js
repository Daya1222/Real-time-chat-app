const express = require("express");
const { login, authorize, register, adminOnly } = require("./auth.js");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

PORT = 3000;

//Home
app.get("/", authorize, (req, res) => {
  res.send("homepage");
  console.error(err);
});

//Login
app.post("/login", login);
app.post("/register", register);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
