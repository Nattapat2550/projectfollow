// backend/controllers/immigrantController.js

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const dashboardService = require("../services/dashboardService"); // 🟢 เรียกใช้ Service

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new Pool({ connectionString, ssl: isLocalhost ? false : { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

exports.getAllData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const [illegals, totalIllegals, deporteds, totalDeporteds] = await Promise.all([
      prisma.illegal_immigrants.findMany({ orderBy: { detected_date: "desc" }, skip, take: limit }),
      prisma.illegal_immigrants.count(),
      prisma.deported_persons.findMany({ orderBy: { return_date: "desc" }, skip, take: limit }),
      prisma.deported_persons.count()
    ]);

    res.status(200).json({ 
      success: true, 
      data: { 
        illegals, 
        deporteds,
        meta: { illegalsTotal: totalIllegals, deportedsTotal: totalDeporteds, currentPage: page, limit: limit }
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const type = req.query.type || "deported";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // 🟢 ให้ Service จัดการสร้าง Query Conditions ทั้งหมด
    const { whereCondition, orderByCondition } = dashboardService.buildDashboardQuery(req.query, type);

    let tableData = [];
    let totalItems = 0;

    if (type === "deported") {
      [tableData, totalItems] = await Promise.all([
        prisma.deported_persons.findMany({ where: whereCondition, skip, take: limit, orderBy: orderByCondition }),
        prisma.deported_persons.count({ where: whereCondition }),
      ]);
    } else {
      [tableData, totalItems] = await Promise.all([
        prisma.illegal_immigrants.findMany({ where: whereCondition, skip, take: limit, orderBy: orderByCondition }),
        prisma.illegal_immigrants.count({ where: whereCondition }),
      ]);
    }

    res.status(200).json({ 
      success: true, 
      tableData, 
      meta: { 
        totalItems, 
        totalPages: Math.ceil(totalItems / limit) || 1, 
        currentPage: page, 
        limit: limit 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error", error: err.message });
  }
};