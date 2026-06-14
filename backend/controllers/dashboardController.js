// backend/controllers/dashboardController.js
const pool = require("../config/db");

exports.getDashboardStats = async (req, res) => {
  try {
    const { 
      type = "illegal", 
      nationality = "ทั้งหมด", 
      gender = "ทั้งหมด", 
      startDate, 
      endDate,
      isVictim = "ทั้งหมด",
      hasPassport = "ทั้งหมด",
      page = 1,
      limit = 50,
      sortBy,             // 👈 รับพารามิเตอร์เรียงข้อมูล
      sortOrder = "asc"   // 👈 รับทิศทางการเรียง
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let tableName = type === "deported" ? "deported_persons" : "illegal_immigrants";
    let dateField = type === "deported" ? "return_date" : "detected_date";

    let conditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (startDate && endDate) {
      conditions.push(`${dateField} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    }
    if (type === "illegal" && nationality && nationality !== "ทั้งหมด") {
      conditions.push(`nationality = $${paramIndex}`);
      queryParams.push(nationality);
      paramIndex++;
    }
    if (gender && gender !== "ทั้งหมด") {
      conditions.push(`gender = $${paramIndex}`);
      queryParams.push(gender);
      paramIndex++;
    }

    if (type === "illegal") {
      if (isVictim === "true" || isVictim === "false") {
        conditions.push(`is_victim = $${paramIndex}`);
        queryParams.push(isVictim === "true");
        paramIndex++;
      }
      if (hasPassport === "true") {
        conditions.push(`passport_id IS NOT NULL AND passport_id ~ '\\S' AND LOWER(TRIM(passport_id)) NOT IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง')`);
      } else if (hasPassport === "false") {
        conditions.push(`(passport_id IS NULL OR TRIM(passport_id) = '' OR LOWER(TRIM(passport_id)) IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง'))`);
      }
    }

    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // ─── กำหนดรูปแบบการ Sort (ป้องกัน SQL Injection) ───
    let orderClause = `ORDER BY ${dateField} DESC, id DESC`; 
    if (sortBy) {
      const dir = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
      
      if (sortBy === "name") {
          // ถ้ากดเรียงชื่อ ให้เรียงตาม first_name_th และ last_name_th ใน DB
          orderClause = `ORDER BY first_name_th ${dir} NULLS LAST, last_name_th ${dir} NULLS LAST, id DESC`;
      } else {
          const allowedColumns = ["nationality", "detected_date", "detected_location", "is_victim", "date_of_birth", "national_id", "address", "return_date", "result"];
          if (allowedColumns.includes(sortBy)) {
              orderClause = `ORDER BY ${sortBy} ${dir} NULLS LAST, id DESC`;
          }
      }
    }

    // ─── ดึงข้อมูลตาราง ───
    const dataQuery = `
      SELECT * FROM ${tableName} 
      ${whereClause} 
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const tableData = await pool.query(dataQuery, [...queryParams, limitNum, offset]);

    // ─── นับจำนวนแถวทั้งหมด ───
    const totalCountQuery = `SELECT COUNT(*) FROM ${tableName} ${whereClause}`;
    const totalCountResult = await pool.query(totalCountQuery, queryParams);
    const totalItems = parseInt(totalCountResult.rows[0].count);

    // ─── ดึงข้อมูลสถิติ/กราฟ ───
    let baseConditions = [];
    let baseParams = [];
    let baseIdx = 1;

    if (startDate && endDate) {
      baseConditions.push(`${dateField} BETWEEN $${baseIdx} AND $${baseIdx + 1}`);
      baseParams.push(startDate, endDate);
      baseIdx += 2;
    }
    if (type === "illegal" && nationality && nationality !== "ทั้งหมด") {
      baseConditions.push(`nationality = $${baseIdx}`);
      baseParams.push(nationality);
      baseIdx++;
    }
    if (gender && gender !== "ทั้งหมด") {
      baseConditions.push(`gender = $${baseIdx}`);
      baseParams.push(gender);
      baseIdx++;
    }
    let baseWhere = baseConditions.length > 0 ? `WHERE ${baseConditions.join(" AND ")}` : "";

    let stats = { total: totalItems };
    let charts = {};

    if (type === "illegal") {
      const victimCountQuery = `SELECT COUNT(*) FROM illegal_immigrants ${baseWhere ? baseWhere + " AND " : "WHERE "} is_victim = true`;
      const victimRes = await pool.query(victimCountQuery, baseParams);
      
      const passportValidCond = `passport_id IS NOT NULL AND passport_id ~ '\\S' AND LOWER(TRIM(passport_id)) NOT IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง')`;
      const passportCountQuery = `SELECT COUNT(*) FROM illegal_immigrants ${baseWhere ? baseWhere + " AND " : "WHERE "} ${passportValidCond}`;
      const passportRes = await pool.query(passportCountQuery, baseParams);

      const natChartQuery = `SELECT COALESCE(nationality, 'ไม่ระบุ') as name, COUNT(*) as value FROM illegal_immigrants ${baseWhere} GROUP BY 1 ORDER BY value DESC LIMIT 6`;
      const natChartRes = await pool.query(natChartQuery, baseParams);

      const victimChartQuery = `SELECT CASE WHEN is_victim = true THEN 'เป็นผู้เสียหาย' ELSE 'ไม่เป็นผู้เสียหาย' END as name, COUNT(*) as value FROM illegal_immigrants ${baseWhere} GROUP BY 1 ORDER BY value DESC`;
      const victimChartRes = await pool.query(victimChartQuery, baseParams);

      const passportChartQuery = `SELECT CASE WHEN ${passportValidCond} THEN 'มีหนังสือเดินทาง' ELSE 'ไม่มีข้อมูล / ไม่มี' END as name, COUNT(*) as value FROM illegal_immigrants ${baseWhere} GROUP BY 1 ORDER BY value DESC`;
      const passportChartRes = await pool.query(passportChartQuery, baseParams);

      stats.victims = parseInt(victimRes.rows[0].count);
      stats.hasPassport = parseInt(passportRes.rows[0].count);
      charts.nationality = natChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
      charts.victim = victimChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
      charts.passport = passportChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
    } else {
      const successCountQuery = `SELECT COUNT(*) FROM deported_persons ${baseWhere ? baseWhere + " AND " : "WHERE "} result = 'SUCCESS'`;
      const successRes = await pool.query(successCountQuery, baseParams);

      const channelChartQuery = `SELECT COALESCE(channel, 'ไม่ระบุช่องทาง') as name, COUNT(*) as value FROM deported_persons ${baseWhere} GROUP BY 1 ORDER BY value DESC`;
      const channelChartRes = await pool.query(channelChartQuery, baseParams);

      stats.success = parseInt(successRes.rows[0].count);
      charts.channel = channelChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
    }

    // ─── ดึงตัวเลือก ───
    let allNatsRes = { rows: [] };
    if (type === "illegal") {
      allNatsRes = await pool.query(`SELECT DISTINCT COALESCE(nationality, 'ไม่ระบุ') as nat FROM illegal_immigrants WHERE nationality IS NOT NULL AND nationality != '' ORDER BY nat`);
    }

    const allGendersRes = await pool.query(`SELECT DISTINCT COALESCE(gender, 'ไม่ระบุ') as gen FROM ${tableName} WHERE gender IS NOT NULL AND gender != '' ORDER BY gen`);

    res.status(200).json({
      success: true,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
        allNationalities: type === "illegal" ? ["ทั้งหมด", ...allNatsRes.rows.map(r => r.nat)] : ["ทั้งหมด"],
        allGenders: ["ทั้งหมด", ...allGendersRes.rows.map(r => r.gen)]
      },
      stats,
      charts,
      tableData: tableData.rows
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};