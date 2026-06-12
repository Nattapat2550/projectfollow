const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pool = require("../config/db");

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token; // รองรับการอ่าน Token จาก Cookie
  }

  if (!token || token === "null") {
    return res.status(401).json({
      success: false,
      message: "Not authorize to access this route",
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbacksecret");
    
    // ค้นหา User ผ่าน Prisma
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "User not found, authorization denied",
        });
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      success: false,
      message: "Not authorize to access this route",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};