const pool = require("../config/db");
const dashboardService = require("../services/dashboardService"); 

exports.getAllData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const [illegalsRes, illegalsCountRes, deportedsRes, deportedsCountRes] = await Promise.all([
      pool.query("SELECT * FROM illegal_immigrants ORDER BY detected_date DESC NULLS LAST LIMIT $1 OFFSET $2", [limit, offset]),
      pool.query("SELECT COUNT(*) FROM illegal_immigrants"),
      pool.query("SELECT * FROM deported_persons ORDER BY return_date DESC NULLS LAST LIMIT $1 OFFSET $2", [limit, offset]),
      pool.query("SELECT COUNT(*) FROM deported_persons")
    ]);

    res.status(200).json({ 
      success: true, 
      data: { 
        illegals: illegalsRes.rows, 
        deporteds: deportedsRes.rows,
        meta: { 
          illegalsTotal: parseInt(illegalsCountRes.rows[0].count), 
          deportedsTotal: parseInt(deportedsCountRes.rows[0].count), 
          currentPage: page, 
          limit: limit 
        }
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const type = req.query.type || "deported";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    // 🟢 สร้าง SQL Query จาก Service
    const { whereClause, params, orderClause } = dashboardService.buildDashboardQuerySQL(req.query, type);
    const tableName = type === "deported" ? "deported_persons" : "illegal_immigrants";
    const paramCount = params.length;

    const dataQuery = `SELECT * FROM ${tableName} ${whereClause} ${orderClause} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    const countQuery = `SELECT COUNT(*) FROM ${tableName} ${whereClause}`;

    const [dataRes, countRes] = await Promise.all([
      pool.query(dataQuery, [...params, limit, offset]),
      pool.query(countQuery, params)
    ]);

    const totalItems = parseInt(countRes.rows[0].count);

    res.status(200).json({ 
      success: true, 
      tableData: dataRes.rows, 
      meta: { 
        totalItems, 
        totalPages: Math.ceil(totalItems / limit) || 1, 
        currentPage: page, 
        limit: limit 
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error", error: err.message });
  }
};