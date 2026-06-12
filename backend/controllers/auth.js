const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ฟังก์ชันสร้าง JWT Token
const getSignedJwtToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallbacksecret", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// ฟังก์ชันส่ง Token กลับไปทาง Cookie และ JSON
const sendTokenResponse = (user, statusCode, res) => {
  const token = getSignedJwtToken(user.id);

  const expireDays = parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 30;

  const options = {
    expires: new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      color: user.color,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, password, role, color } = req.body;

    if (!name || !password) {
      return res.status(400).json({ success: false, msg: "Please provide a name and password" });
    }

    const existingUser = await prisma.user.findUnique({ where: { name } });
    if (existingUser) {
      return res.status(400).json({ success: false, msg: "Name already in use" });
    }

    // ใช้สิทธิ์ user เป็นค่าเริ่มต้นหากไม่ได้ระบุมา
    const userRole = role || "user";
    
    // กำหนดสีเริ่มต้นถ้าไม่ได้ส่งมา
    const userColor = color || "#3B82F6";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
        role: userRole,
        color: userColor,
      },
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error during registration" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ success: false, msg: "Please provide a name and password" });
    }

    const user = await prisma.user.findUnique({ where: { name } });
    if (!user) {
      return res.status(401).json({ success: false, msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, msg: "Invalid credentials" });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
exports.logout = async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, data: {} });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // ซ่อนรหัสผ่านไม่ให้ส่งกลับไปให้หน้าบ้าน
    delete user.password;

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};