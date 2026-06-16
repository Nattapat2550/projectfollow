const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ฟังก์ชันสร้าง JWT Token
const getSignedJwtToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallbacksecret", {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// ฟังก์ชันส่ง Token กลับไปทาง Cookie และ JSON (ปรับปรุงแก้บัค Cookie)
const sendTokenResponse = (user, statusCode, res) => {
  const token = getSignedJwtToken(user.id);

  const expireDays = parseInt(process.env.JWT_COOKIE_EXPIRE, 10) || 30;

  const options = {
    expires: new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    path: "/", // แก้บัคให้ Cookie เข้าถึงได้จากทุก Path หน้าบ้าน
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  };

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

    // เช็คว่ามีผู้ใช้นี้อยู่แล้วหรือไม่
    const existingUserResult = await pool.query("SELECT id FROM users WHERE name = $1", [name]);
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ success: false, msg: "Name already in use" });
    }

    // ใช้สิทธิ์ user และสีเป็นค่าเริ่มต้นหากไม่ได้ระบุมา
    const userRole = role || "user";
    const userColor = color || "#3B82F6";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // สร้าง User ใหม่
    const insertQuery = `
      INSERT INTO users (name, password, role, color) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *;
    `;
    const newUserResult = await pool.query(insertQuery, [name, hashedPassword, userRole, userColor]);
    const user = newUserResult.rows[0];

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

    // ค้นหา User
    const userResult = await pool.query("SELECT * FROM users WHERE name = $1", [name]);
    const user = userResult.rows[0];

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
  // ล้างข้อมูล Cookie แบบเบ็ดเสร็จ
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: "/",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production"
  });

  // บังคับเคลียร์ Storage
  res.setHeader("Clear-Site-Data", '"cookies", "storage"');

  res.status(200).json({ success: true, data: {} });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    // req.user.id ได้มาจาก Middleware auth
    const userResult = await pool.query("SELECT id, name, role, color FROM users WHERE id = $1", [req.user.id]);
    const user = userResult.rows[0];
    
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};