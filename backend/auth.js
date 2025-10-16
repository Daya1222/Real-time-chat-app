const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Users } = require("./models.js");
const dotenv = require("dotenv");

//read the secret key
dotenv.config();
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) throw new Error("JWT_SECRET not defined in environment");

//Authorization
async function authorize(req, res, next) {
    const authHeader = req.headers["authorization"]; // lowercase 'headers'
    if (!authHeader)
        return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token malformed" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userExists = await Users.findOne({ userName: decoded.userName });
        if (!userExists) {
            return res.status(401).json({ message: "User no longer exists" });
        }

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Unauthorized" });
    }
}

//Provide JWT token
async function genToken(user) {
    const payload = { _id: user._id, userName: user.userName, role: user.role };
    return jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
}

// login logic
// login logic
async function login(req, res) {
    const userName = req.body.creds["userName"];
    const password = req.body.creds["password"];
    if (!userName) {
        return res.status(400).json({ msg: "No username" });
    } else if (!password) {
        return res.status(400).json({ msg: "No password" });
    }

    const user = await Users.findOne({ userName: userName });
    if (!user) {
        return res.status(401).json({ msg: "Unauthorized" });
    }

    const passwordHash = user.passwordHash;

    //check if the password is same as hashed one.
    if (await bcrypt.compare(password, passwordHash)) {
        res.status(200).json({
            token: await genToken(user), // ✅ Pass user object, not userName string
            user: { _id: user._id, userName: user.userName, role: user.role },
        });
    } else {
        return res.status(401).json({ msg: "Unauthorized" });
    }
}

//Hashing and register logic

async function hasher(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function register(req, res, next) {
    const { userName, password, email } = req.body.creds;
    if (!userName || !password || !email) {
        return res
            .status(400)
            .json({ msg: "Missing username, password, or email" });
    }

    try {
        const hashedPassword = await hasher(password);
        const newUser = await Users.create({
            userName: userName,
            passwordHash: hashedPassword,
            email: email,
        });
        req.user = newUser;
        next();
    } catch (err) {
        if (err.code === 11000) {
            return res
                .status(409)
                .json({ msg: "Username or email already exists" });
        } else {
            console.error(err);
            return res.status(500).json({ msg: "Internal server error" });
        }
    }
}

//Checks if admin
function isAdmin(req, res, next) {
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
        if (decoded.role === "admin") {
            next();
        } else {
            return res.status(403).json({ msg: "Forbidden" });
        }
    } catch (err) {
        res.status(401).json({ msg: "Unauthorized" });
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
