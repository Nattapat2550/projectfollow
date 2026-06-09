const pool = require("../config/db");

exports.getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // รับ parameter ถ้าผู้ใช้เลือกกรองจากวันที่
    
    let dateFilterIllegal = "";
    let dateFilterDeported = "";
    let queryParams = [];

    if (startDate && endDate) {
      dateFilterIllegal = `WHERE detected_date BETWEEN $1 AND $2`;
      dateFilterDeported = `WHERE return_date BETWEEN $1 AND $2`;
      queryParams = [startDate, endDate];
    }

    // --- สถิติแอบเข้า ---
    const totalIllegal = await pool.query(`SELECT COUNT(*) FROM illegal_immigrants ${dateFilterIllegal}`, queryParams);
    const victims = await pool.query(`SELECT COUNT(*) FROM illegal_immigrants ${dateFilterIllegal ? dateFilterIllegal + " AND " : "WHERE "} is_victim = true`, queryParams);
    const hasPassport = await pool.query(`SELECT COUNT(*) FROM illegal_immigrants ${dateFilterIllegal ? dateFilterIllegal + " AND " : "WHERE "} passport_id IS NOT NULL AND passport_id != ''`, queryParams);
    
    // --- สถิติส่งกลับ ---
    const totalDeported = await pool.query(`SELECT COUNT(*) FROM deported_persons ${dateFilterDeported}`, queryParams);
    // นับช่องทางว่ามาช่องทางไหนกี่คน
    const channelStats = await pool.query(`SELECT channel, COUNT(*) as count FROM deported_persons ${dateFilterDeported} GROUP BY channel`, queryParams);
    
    res.status(200).json({
      success: true,
      data: {
        illegal: {
          total: parseInt(totalIllegal.rows[0].count),
          victims: parseInt(victims.rows[0].count),
          hasPassport: parseInt(hasPassport.rows[0].count),
        },
        deported: {
          total: parseInt(totalDeported.rows[0].count),
          channels: channelStats.rows.map(row => ({
            channel: row.channel || "ไม่ระบุช่องทาง",
            count: parseInt(row.count)
          }))
        }
      }
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};