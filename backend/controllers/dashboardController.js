const pool = require("../config/db");

exports.getDashboardStats = async (req, res) => {
  try {
    // --- สถิติแอบเข้า ---
    const totalIllegalRes = await pool.query(`SELECT COUNT(*) FROM illegal_immigrants`);
    const victimsRes = await pool.query(`SELECT COUNT(*) FROM illegal_immigrants WHERE is_victim = true`);
    const passportRes = await pool.query(`SELECT COUNT(*) FROM illegal_immigrants WHERE passport_id IS NOT NULL AND passport_id != ''`);
    
    // --- สถิติส่งกลับ ---
    const totalDeportedRes = await pool.query(`SELECT COUNT(*) FROM deported_persons`);
    
    res.status(200).json({
      success: true,
      data: {
        illegal: {
          total: parseInt(totalIllegalRes.rows[0].count),
          victims: parseInt(victimsRes.rows[0].count),
          hasPassport: parseInt(passportRes.rows[0].count),
        },
        deported: {
          total: parseInt(totalDeportedRes.rows[0].count),
        }
      }
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};