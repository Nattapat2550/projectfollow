// backend/controllers/dashboardController.js
const pool = require("../config/db");

// ฟังก์ชันแปลงปี พ.ศ. เป็น ค.ศ. อัตโนมัติ กรณีพิมพ์ปี 25xx เข้ามา
const convertBEtoAD = (dateStr) => {
    if (!dateStr || String(dateStr).trim() === "") return null;
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
        let year = parseInt(parts[0], 10);
        if (year > 2400) {
            year -= 543;
            return `${year}-${parts[1]}-${parts[2]}`;
        }
    }
    return dateStr;
};

exports.getDashboardStats = async (req, res) => {
  try {
    const { 
      type = "illegal", 
      nationality = "ทั้งหมด", 
      province = "ทั้งหมด",
      gender = "ทั้งหมด", 
      startDate: rawStartDate, 
      endDate: rawEndDate,
      dobStart: rawDobStart, 
      dobEnd: rawDobEnd,   
      isVictim = "ทั้งหมด",
      hasPassport = "ทั้งหมด",
      creator = "ทั้งหมด", 
      page = 1,
      limit = 50,
      sortBy,             
      sortOrder = "asc"   
    } = req.query;

    const startDate = convertBEtoAD(rawStartDate);
    const endDate = convertBEtoAD(rawEndDate);
    const dobStart = convertBEtoAD(rawDobStart);
    const dobEnd = convertBEtoAD(rawDobEnd);

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    const vStart = !!startDate;
    const vEnd = !!endDate;
    const vDobStart = !!dobStart;
    const vDobEnd = !!dobEnd;

    let tableName = type === "repatriated" ? "repatriated_persons" : "illegal_immigrants";
    let dateField = type === "repatriated" ? "return_date" : "detected_date";

    let conditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (vStart && vEnd) {
      conditions.push(`DATE(t.${dateField}) >= $${paramIndex} AND DATE(t.${dateField}) <= $${paramIndex + 1}`);
      queryParams.push(startDate, endDate);
      paramIndex += 2;
    } else if (vStart) {
      conditions.push(`DATE(t.${dateField}) >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    } else if (vEnd) {
      conditions.push(`DATE(t.${dateField}) <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }

    if (type === "repatriated") {
      if (vDobStart && vDobEnd) {
        conditions.push(`DATE(t.date_of_birth) >= $${paramIndex} AND DATE(t.date_of_birth) <= $${paramIndex + 1}`);
        queryParams.push(dobStart, dobEnd);
        paramIndex += 2;
      } else if (vDobStart) {
        conditions.push(`DATE(t.date_of_birth) >= $${paramIndex}`);
        queryParams.push(dobStart);
        paramIndex++;
      } else if (vDobEnd) {
        conditions.push(`DATE(t.date_of_birth) <= $${paramIndex}`);
        queryParams.push(dobEnd);
        paramIndex++;
      }
    }

    if (type === "illegal" && nationality && nationality !== "ทั้งหมด") {
      conditions.push(`t.nationality = $${paramIndex}`);
      queryParams.push(nationality);
      paramIndex++;
    }

    if (province && province !== "ทั้งหมด") {
      const provField = type === "repatriated" ? "t.province" : "t.detected_location_province";
      if (province === "ไม่ระบุ") {
        conditions.push(`(${provField} IS NULL OR TRIM(${provField}) = '' OR ${provField} = 'ไม่ระบุ')`);
      } else {
        conditions.push(`${provField} = $${paramIndex}`);
        queryParams.push(province);
        paramIndex++;
      }
    }
    
    // เงื่อนไข Filter เพศ ที่รองรับ "ไม่ระบุ"
    if (gender && gender !== "ทั้งหมด") {
      if (gender === "ไม่ระบุ") {
        conditions.push(`(t.gender IS NULL OR TRIM(t.gender) = '' OR t.gender = 'ไม่ระบุ')`);
      } else {
        conditions.push(`t.gender = $${paramIndex}`);
        queryParams.push(gender);
        paramIndex++;
      }
    }

    if (type === "illegal") {
      // 🟢 ปรับแก้การรับค่า is_victim ให้รองรับรูปแบบเดิมที่ Frontend อาจจะส่งมาเป็น "true"/"false" หรือส่งมาเป็น ENUM โดยตรง
      if (isVictim === "true" || isVictim === "YES") {
        conditions.push(`t.is_victim = $${paramIndex}`);
        queryParams.push('YES');
        paramIndex++;
      } else if (isVictim === "false" || isVictim === "NO") {
        conditions.push(`t.is_victim = $${paramIndex}`);
        queryParams.push('NO');
        paramIndex++;
      } else if (isVictim === "PENDING") {
        conditions.push(`t.is_victim = $${paramIndex}`);
        queryParams.push('PENDING');
        paramIndex++;
      }

      if (hasPassport === "true") {
        conditions.push(`t.passport_id IS NOT NULL AND t.passport_id ~ '\\S' AND LOWER(TRIM(t.passport_id)) NOT IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง')`);
      } else if (hasPassport === "false") {
        conditions.push(`(t.passport_id IS NULL OR TRIM(t.passport_id) = '' OR LOWER(TRIM(t.passport_id)) IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง'))`);
      }
    }

    if (creator && creator !== "ทั้งหมด") {
      conditions.push(`u.name = $${paramIndex}`);
      queryParams.push(creator);
      paramIndex++;
    }

    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderClause = `ORDER BY t.${dateField} DESC NULLS LAST, t.id DESC`; 
    if (sortBy) {
      const dir = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
      if (sortBy === "name") {
          orderClause = `ORDER BY t.first_name_th ${dir} NULLS LAST, t.last_name_th ${dir} NULLS LAST, t.id DESC`;
      } else if (sortBy === "creator") {
          orderClause = `ORDER BY u.name ${dir} NULLS LAST, t.id DESC`;
      } else if (sortBy === "detected_location") {
          orderClause = `ORDER BY t.detected_location_province ${dir} NULLS LAST, t.detected_location_district ${dir} NULLS LAST, t.detected_location_sub_district ${dir} NULLS LAST, t.detected_location_details ${dir} NULLS LAST, t.id DESC`;
      } else if (sortBy === "address") {
          orderClause = `ORDER BY t.province ${dir} NULLS LAST, t.district ${dir} NULLS LAST, t.sub_district ${dir} NULLS LAST, t.address_details ${dir} NULLS LAST, t.id DESC`;
      } else {
          const allowedColumns = ["nationality", "detected_date", "is_victim", "date_of_birth", "national_id", "return_date", "result", "channel"];
          if (allowedColumns.includes(sortBy)) {
              orderClause = `ORDER BY t.${sortBy} ${dir} NULLS LAST, t.id DESC`;
          }
      }
    }

    const dataQuery = `
      SELECT t.*, u.name as creator_name 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${whereClause} 
      ${orderClause} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const tableData = await pool.query(dataQuery, [...queryParams, limitNum, offset]);

    const totalCountQuery = `
      SELECT COUNT(*) 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${whereClause}
    `;
    const totalCountResult = await pool.query(totalCountQuery, queryParams);
    const totalItems = parseInt(totalCountResult.rows[0].count);

    let baseWhere = whereClause;
    let baseParams = queryParams;

    let stats = { total: totalItems };
    let charts = {};

    // 🌟 ดึงข้อมูลกราฟเพศ (ทำได้ทั้ง 2 ประเภทข้อมูล)
    const genderChartQuery = `
      SELECT 
        CASE 
          WHEN t.gender IS NULL OR TRIM(t.gender) = '' THEN 'ไม่ระบุ' 
          ELSE t.gender 
        END as name, 
        COUNT(*) as value 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${baseWhere} 
      GROUP BY 1 
      ORDER BY value DESC
    `;
    const genderChartRes = await pool.query(genderChartQuery, baseParams);
    charts.gender = genderChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));

    if (type === "illegal") {
      // 🟢 ปรับแก้การนับและจัดกลุ่ม is_victim ให้รองรับ ENUM ('YES', 'NO', 'PENDING')
      const victimCountQuery = `SELECT COUNT(*) FROM illegal_immigrants t LEFT JOIN users u ON t.created_by = u.id ${baseWhere ? baseWhere + " AND " : "WHERE "} t.is_victim = 'YES'`;
      const victimRes = await pool.query(victimCountQuery, baseParams);
      
      const passportValidCond = `t.passport_id IS NOT NULL AND t.passport_id ~ '\\S' AND LOWER(TRIM(t.passport_id)) NOT IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง')`;
      const passportCountQuery = `SELECT COUNT(*) FROM illegal_immigrants t LEFT JOIN users u ON t.created_by = u.id ${baseWhere ? baseWhere + " AND " : "WHERE "} ${passportValidCond}`;
      const passportRes = await pool.query(passportCountQuery, baseParams);

      const natChartQuery = `SELECT COALESCE(t.nationality, 'ไม่ระบุ') as name, COUNT(*) as value FROM illegal_immigrants t LEFT JOIN users u ON t.created_by = u.id ${baseWhere} GROUP BY 1 ORDER BY value DESC LIMIT 6`;
      const natChartRes = await pool.query(natChartQuery, baseParams);

      // 🟢 ปรับแก้การแสดงผลชื่อบนกราฟ ให้รองรับสถานะ PENDING 
      const victimChartQuery = `
        SELECT 
          CASE 
            WHEN t.is_victim = 'YES' THEN 'เป็นผู้เสียหาย' 
            WHEN t.is_victim = 'NO' THEN 'ไม่เป็นผู้เสียหาย'
            ELSE 'รอดำเนินการคัดกรอง' 
          END as name, 
          COUNT(*) as value 
        FROM illegal_immigrants t 
        LEFT JOIN users u ON t.created_by = u.id 
        ${baseWhere} 
        GROUP BY 1 
        ORDER BY value DESC
      `;
      const victimChartRes = await pool.query(victimChartQuery, baseParams);

      const passportChartQuery = `SELECT CASE WHEN ${passportValidCond} THEN 'มีหนังสือเดินทาง' ELSE 'ไม่มีข้อมูล / ไม่มี' END as name, COUNT(*) as value FROM illegal_immigrants t LEFT JOIN users u ON t.created_by = u.id ${baseWhere} GROUP BY 1 ORDER BY value DESC`;
      const passportChartRes = await pool.query(passportChartQuery, baseParams);

      stats.victims = parseInt(victimRes.rows[0].count);
      stats.hasPassport = parseInt(passportRes.rows[0].count);
      charts.nationality = natChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
      charts.victim = victimChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
      charts.passport = passportChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
    } else {
      const successCountQuery = `SELECT COUNT(*) FROM repatriated_persons t LEFT JOIN users u ON t.created_by = u.id ${baseWhere ? baseWhere + " AND " : "WHERE "} t.result = 'SUCCESS'`;
      const successRes = await pool.query(successCountQuery, baseParams);

      const channelChartQuery = `SELECT COALESCE(t.channel, 'ไม่ระบุช่องทาง') as name, COUNT(*) as value FROM repatriated_persons t LEFT JOIN users u ON t.created_by = u.id ${baseWhere} GROUP BY 1 ORDER BY value DESC`;
      const channelChartRes = await pool.query(channelChartQuery, baseParams);

      stats.success = parseInt(successRes.rows[0].count);
      charts.channel = channelChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));
    }

    const creatorChartQuery = `
      SELECT 
        COALESCE(u.name, 'ไม่ทราบผู้เพิ่ม') as name, 
        u.color as color, 
        COUNT(*) as value 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${baseWhere} 
      GROUP BY u.name, u.color 
      ORDER BY value DESC 
      LIMIT 10
    `;
    const creatorChartRes = await pool.query(creatorChartQuery, baseParams);
    charts.creator = creatorChartRes.rows.map(r => ({ 
      name: r.name, 
      value: parseInt(r.value),
      color: r.color 
    }));

    // 🌟 ดึงข้อมูลกราฟจังหวัด (Top 6)
    const provFieldForChart = type === "repatriated" ? "province" : "detected_location_province";
    const provinceChartQuery = `
      SELECT 
        COALESCE(NULLIF(TRIM(t.${provFieldForChart}), ''), 'ไม่ระบุ') as name, 
        COUNT(*) as value 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${baseWhere} 
      GROUP BY 1 
      ORDER BY value DESC 
      LIMIT 6
    `;
    const provinceChartRes = await pool.query(provinceChartQuery, baseParams);
    charts.province = provinceChartRes.rows.map(r => ({ name: r.name, value: parseInt(r.value) }));

    let allNatsRes = { rows: [] };
    if (type === "illegal") {
      allNatsRes = await pool.query(`SELECT DISTINCT COALESCE(t.nationality, 'ไม่ระบุ') as nat FROM illegal_immigrants t WHERE t.nationality IS NOT NULL AND t.nationality != '' ORDER BY nat`);
    }

    const allGendersRes = await pool.query(`
      SELECT DISTINCT 
        CASE 
          WHEN t.gender IS NULL OR TRIM(t.gender) = '' THEN 'ไม่ระบุ' 
          ELSE t.gender 
        END as gen 
      FROM ${tableName} t 
      ORDER BY gen
    `);
    
    const allCreatorsRes = await pool.query(`SELECT DISTINCT u.name as creator FROM ${tableName} t JOIN users u ON t.created_by = u.id WHERE u.name IS NOT NULL ORDER BY u.name`);

    const provField = type === "repatriated" ? "province" : "detected_location_province";
    const allProvincesRes = await pool.query(`SELECT DISTINCT COALESCE(NULLIF(TRIM(t.${provField}), ''), 'ไม่ระบุ') as prov FROM ${tableName} t ORDER BY prov`);

    res.status(200).json({
      success: true,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum) || 1,
        currentPage: pageNum,
        allNationalities: type === "illegal" ? ["ทั้งหมด", ...allNatsRes.rows.map(r => r.nat)] : ["ทั้งหมด"],
        allProvinces: ["ทั้งหมด", ...allProvincesRes.rows.map(r => r.prov)],
        allGenders: ["ทั้งหมด", ...allGendersRes.rows.map(r => r.gen)],
        allCreators: ["ทั้งหมด", ...allCreatorsRes.rows.map(r => r.creator)]
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