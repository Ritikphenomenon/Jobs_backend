

const express = require("express");
const {  SECRET, authenticateJwt } = require("../middleware/index");
const { User } = require("../db/userSchema");
const jwt = require("jsonwebtoken");
const router = express.Router();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.json({ message: "Please fill full form!" });
    }
    const isEmail = await User.findOne({ email });
    if (isEmail) {
      return res.json({ message: "Email already registered!" });
    }

    
    const hashedPassword = await bcrypt.hash(password,10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    res.status(200).json({ message: "User created successfully, please login" });

  } catch (error) {
    res.status(500).json({ message: `Server error during User signup ${error}` });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please provide email, password, and role." });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.role !== role) {
      return res
        .status(404)
        .json({
          message: `User with provided email and role ${role} not found.`,
        });
    }

    // Include _id in the JWT payload
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role },
      SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE,
      }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ message: "Server error during user login." });
  }
});



router.get("/getuser", authenticateJwt, async (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});



module.exports=router;
