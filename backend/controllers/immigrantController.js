// backend/controllers/immigrantController.js

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { convertBEtoAD } = require("../utils/immigrantHelpers");

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
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
    const search = req.query.search;
    
    const startDate = convertBEtoAD(req.query.startDate);
    const endDate = convertBEtoAD(req.query.endDate);
    const vStart = startDate && startDate.trim() !== "";
    const vEnd = endDate && endDate.trim() !== "";

    const dobStart = convertBEtoAD(req.query.dobStart);
    const dobEnd = convertBEtoAD(req.query.dobEnd);
    const vDobStart = dobStart && dobStart.trim() !== "";
    const vDobEnd = dobEnd && dobEnd.trim() !== "";

    const skip = (page - 1) * limit;
    let whereCondition = { AND: [] };

    if (vStart || vEnd) {
      const dateField = type === "deported" ? "return_date" : "detected_date";
      let dateFilter = {};
      if (vStart) dateFilter.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (vEnd) dateFilter.lte = new Date(`${endDate}T23:59:59.999Z`);
      whereCondition.AND.push({ [dateField]: dateFilter });
    }

    if (vDobStart || vDobEnd) {
      let dobFilter = {};
      if (vDobStart) dobFilter.gte = new Date(`${dobStart}T00:00:00.000Z`);
      if (vDobEnd) dobFilter.lte = new Date(`${dobEnd}T23:59:59.999Z`);
      whereCondition.AND.push({ date_of_birth: dobFilter });
    }

    if (search && search.trim() !== "") {
      const keywords = search.trim().split(/\s+/);
      const searchConditions = keywords.map((keyword) => {
        const searchFields = [
          { first_name_th: { contains: keyword, mode: "insensitive" } },
          { last_name_th: { contains: keyword, mode: "insensitive" } },
          { first_name_en: { contains: keyword, mode: "insensitive" } },
          { last_name_en: { contains: keyword, mode: "insensitive" } },
          { passport_id: { contains: keyword, mode: "insensitive" } },
        ];
        if (type === "deported") {
          searchFields.push({ national_id: { contains: keyword, mode: "insensitive" } });
          searchFields.push({ channel: { contains: keyword, mode: "insensitive" } });
        } else {
          searchFields.push({ nationality: { contains: keyword, mode: "insensitive" } });
          searchFields.push({ detected_location: { contains: keyword, mode: "insensitive" } });
        }
        return { OR: searchFields };
      });
      whereCondition.AND.push(...searchConditions);
    }
    
    if (whereCondition.AND.length === 0) whereCondition = {};

    let orderByCondition = {};
    if (sortBy && sortBy.trim() !== "") {
      if (sortBy === "name") orderByCondition = [{ first_name_th: sortOrder }, { last_name_th: sortOrder }];
      else orderByCondition = { [sortBy]: sortOrder };
    } else {
      orderByCondition = type === "deported" ? { return_date: "desc" } : { detected_date: "desc" };
    }

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

    res.status(200).json({ success: true, tableData, meta: { totalItems, totalPages: Math.ceil(totalItems / limit) || 1, currentPage: page, limit: limit } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error", error: err.message });
  }
};