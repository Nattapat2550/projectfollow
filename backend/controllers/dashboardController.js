const pool = require("../config/db");

exports.getDashboardStats = async (req, res) => {
  try {
    // รับ Parameters ตัวกรองและการทำหน้าจาก Frontend
    const { 
      type = "illegal", 
      nationality = "ทั้งหมด", 
      gender = "ทั้งหมด", 
      startDate, 
      endDate,
      isVictim = "ทั้งหมด",
      hasPassport = "ทั้งหมด",
      page = 1,
      limit = 50
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    // ─── 1. สร้าง Dynamic Query สำหรับตารางข้อมูลและการนับสถิติ ───
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

    if (nationality && nationality !== "ทั้งหมด") {
      conditions.push(`nationality = $${paramIndex}`);
      queryParams.push(nationality);
      paramIndex++;
    }

    if (gender && gender !== "ทั้งหมด") {
      conditions.push(`gender = $${paramIndex}`);
      queryParams.push(gender);
      paramIndex++;
    }

    // ฟิลเตอร์เพิ่มเติมเฉพาะประเภทแอบเข้าเมือง (Illegal)
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

    // ─── 2. ดึงข้อมูลตารางตามเงื่อนไขพร้อมทำ Pagination ───
    const dataQuery = `
      SELECT * FROM ${tableName} 
      ${whereClause} 
      ORDER BY ${dateField} DESC, id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const tableData = await pool.query(dataQuery, [...queryParams, limitNum, offset]);

    // ─── 3. นับจำนวนแถวทั้งหมดภายใต้เงื่อนไขตัวกรองปัจจุบัน ───
    const totalCountQuery = `SELECT COUNT(*) FROM ${tableName} ${whereClause}`;
    const totalCountResult = await pool.query(totalCountQuery, queryParams);
    const totalItems = parseInt(totalCountResult.rows[0].count);

    // ─── 4. ดึงข้อมูลภาพรวมสถิติและข้อมูลสำหรับทำกราฟ (คำนวณจากตัวกรองวันที่/สัญชาติ/เพศ เป็นหลัก) ───
    let baseConditions = [];
    let baseParams = [];
    let baseIdx = 1;

    if (startDate && endDate) {
      baseConditions.push(`${dateField} BETWEEN $${baseIdx} AND $${baseIdx + 1}`);
      baseParams.push(startDate, endDate);
      baseIdx += 2;
    }
    if (nationality && nationality !== "ทั้งหมด") {
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

    // ตัวแปรสำหรับเก็บผลลัพธ์ข้อมูลสถิติ/กราฟ
    let stats = { total: totalItems };
    let charts = {};

    if (type === "illegal") {
      // นับผู้เสียหายภายใต้เงื่อนไขพื้นฐาน
      const victimCountQuery = `SELECT COUNT(*) FROM illegal_immigrants ${baseWhere ? baseWhere + " AND " : "WHERE "} is_victim = true`;
      const victimRes = await pool.query(victimCountQuery, baseParams);
      
      // นับผู้มีพาสปอร์ตภายใต้เงื่อนไขพื้นฐาน
      const passportValidCond = `passport_id IS NOT NULL AND passport_id ~ '\\S' AND LOWER(TRIM(passport_id)) NOT IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง')`;
      const passportCountQuery = `SELECT COUNT(*) FROM illegal_immigrants ${baseWhere ? baseWhere + " AND " : "WHERE "} ${passportValidCond}`;
      const passportRes = await pool.query(passportCountQuery, baseParams);

      // ดึงสถิติตามสัญชาติเพื่อทำกราฟวงกลม (Top 6)
      const natChartQuery = `SELECT COALESCE(nationality, 'ไม่ระบุ') as name, COUNT(*) as value FROM illegal_immigrants ${baseWhere} GROUP BY nationality ORDER BY value DESC LIMIT 6`;
      const natChartRes = await pool.query(natChartQuery, baseParams);

      // ดึงข้อมูลสำหรับกราฟผู้เสียหาย
      const victimChartQuery = `SELECT CASE WHEN is_victim = true THEN 'เป็นผู้เสียหาย' ELSE 'ไม่เป็นผู้เสียหาย' END as name, COUNT(*) as value FROM illegal_immigrants ${baseWhere} GROUP BY is_victim ORDER BY value DESC`;
      const victimChartRes = await pool.query(victimChartQuery, baseParams);

      // ดึงข้อมูลสำหรับกราฟพาสปอร์ต
      const passportChartQuery = `SELECT CASE WHEN ${passportValidCond} THEN 'มีหนังสือเดินทาง' ELSE 'ไม่มีข้อมูล / ไม่มี' END as name, COUNT(*) as value FROM illegal_immigrants ${baseWhere} GROUP BY name ORDER BY value DESC`;
      const passportChartRes = await pool.query(passportChartQuery, baseParams);

      stats.victims = parseInt(victimRes.rows[0].count);
      stats.hasPassport = parseInt(passportRes.rows[0].count);
      charts.nationality = natChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
      charts.victim = victimChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
      charts.passport = passportChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
    } else {
      // สำหรับประเภทส่งกลับ (Deported)
      const successCountQuery = `SELECT COUNT(*) FROM deported_persons ${baseWhere ? baseWhere + " AND " : "WHERE "} result = 'SUCCESS'`;
      const successRes = await pool.query(successCountQuery, baseParams);

      const channelChartQuery = `SELECT COALESCE(channel, 'ไม่ระบุช่องทาง') as name, COUNT(*) as value FROM deported_persons ${baseWhere} GROUP BY channel ORDER BY value DESC`;
      const channelChartRes = await pool.query(channelChartQuery, baseParams);

      stats.success = parseInt(successRes.rows[0].count);
      charts.channel = channelChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
    }

    // ─── 5. ดึงตัวเลือก สัญชาติ และ เพศ ทั้งหมดจาก DB เพื่อให้ฟิลเตอร์ถูกต้องครบถ้วน ───
    const [allNatsRes, allGendersRes] = await Promise.all([
      pool.query(`SELECT DISTINCT COALESCE(nationality, 'ไม่ระบุ') as nat FROM ${tableName} WHERE nationality IS NOT NULL AND nationality != '' ORDER BY nat`),
      pool.query(`SELECT DISTINCT COALESCE(gender, 'ไม่ระบุ') as gen FROM ${tableName} WHERE gender IS NOT NULL AND gender != '' ORDER BY gen`)
    ]);

    res.status(200).json({
      success: true,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
        allNationalities: ["ทั้งหมด", ...allNatsRes.rows.map(r => r.nat)],
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