const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Messages, Users } = require("./models.js");
const { json } = require("express");
const dotenv = require("dotenv");

//read the secret key
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET;

//Authorization
function authorize(req, res, next) {
  const authHeader = req.headers["authorization"]; // note: lowercase 'headers'

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "token malformed" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Unauthorized" });
  }
}

//Provide JWT token
async function genToken(userName) {
  const user = await Users.findOne({ userName: userName });
  const payload = {
    _id: user._id,
    userName: userName,
  };

  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
}

// login logic

async function login(req, res, next) {
  const userName = req.body.creds["userName"];
  const password = req.body.creds["password"];
  if (!userName) {
    return res.status(400).json({ msg: "No username" });
  } else if (!password) {
    return res.status(400).json({ msg: "No password" });
  }
  //if both are provided get the password hash for that specific user.

  const user = await Users.findOne({ userName: userName });
  if (!user) {
    return res.status(401).json({ msg: "Unauthorized" });
  }

  const passwordHash = user.passwordHash;

  //check if the password is same as hashed one.
  if (await bcrypt.compare(password, passwordHash)) {
    res.status(200).json({
      token: await genToken(userName),
      user: { _id: user._id, userName: user.userName },
    });
  } else {
    return res.status(401).json({ msg: "Unauthorized" });
  }
}

//Hashing and login logic

function hasher(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function register(req, res, next) {
  const user = req.body.creds["userName"];
  const password = req.body.creds["password"];

  const email = req.body.creds["email"];
  if (!user) {
    return res.status(400).json({ msg: "No username" });
  } else if (!password) {
    return res.status(400).json({ msg: "No password or email provided" });
  } else if (!email) {
    return res.status(400).json({ msg: "No email or password provided" });
  } else {
    let hashedPassword;
    try {
      hashedPassword = await hasher(password);
    } catch (err) {
      return res.status(500).json({ msg: "Hashing failed" });
    }

    try {
      await Users.create({
        userName: user,
        passwordHash: hashedPassword,
        email: email,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(409)
          .json({ msg: "Username or email already exists" });
      } else {
        return res.status(500).json({ msg: "Internal server error" });
      }
    }

    return res.status(200).json({ msg: "User successfully created." });
  }
}

async function isAdmin(req, res, next) {
  const user = req.user;
  const reqUser = await Users.findOne({ _id: user._id });
  if (reqUser.role === "admin") {
    next();
  } else {
    return res.status(401).json({ msg: "Unauthorized" });
  }
}

function isAuthorized(token) {
  try {
    const user = jwt.verify(token, SECRET_KEY);
    return { user: user, status: true };
  } catch (err) {
    return { status: false };
  }
}

module.exports = { register, login, authorize, isAdmin, isAuthorized };
