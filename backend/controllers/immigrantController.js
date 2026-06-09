const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid"); // ใช้สร้าง ID แบบ string

// [GET] ข้อมูลทั้งหมด 2 ฝั่ง (แอบเข้า & ส่งกลับ)
exports.getAllData = async (req, res) => {
  try {
    const illegalsQuery = `SELECT * FROM illegal_immigrants ORDER BY id DESC`;
    const deportedsQuery = `SELECT * FROM deported_persons ORDER BY created_at DESC`;

    const illegals = await pool.query(illegalsQuery);
    const deporteds = await pool.query(deportedsQuery);

    res.status(200).json({
      success: true,
      data: {
        illegals: illegals.rows,
        deporteds: deporteds.rows,
      },
    });
  } catch (err) {
    console.error("Get All Data Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// [POST] สร้างข้อมูลแอบเข้า (ต่างชาติ)
exports.createIllegal = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const id = uuidv4();
    const {
      first_name_th, middle_name_th, last_name_th,
      first_name_en, middle_name_en, last_name_en,
      passport_id, detected_location, is_victim
    } = req.body;

    const query = `
      INSERT INTO illegal_immigrants 
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, passport_id, detected_location, is_victim) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `;
    const values = [
      id, first_name_th, middle_name_th || null, last_name_th,
      first_name_en || null, middle_name_en || null, last_name_en || null,
      passport_id || null, detected_location, is_victim || null
    ];

    const result = await client.query(query, values);
    await client.query("COMMIT");

    res.status(201).json({ success: true, data: result.rows[0], message: "บันทึกข้อมูลแอบเข้าสำเร็จ" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create Illegal Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  } finally {
    client.release();
  }
};

// [POST] สร้างข้อมูลส่งกลับ (คนไทย) พร้อมอัปโหลดรูป
exports.createDeported = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const {
      fullName, dateOfBirth, citizenId, passportNo,
      address, caseIdCount, arrestWarrant, returnDate
    } = req.body;
    
    // Path รูปภาพถ้ามีการอัปโหลดไฟล์เข้ามา
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `
      INSERT INTO deported_persons 
      (full_name, date_of_birth, citizen_id, passport_no, address, photo_url, case_id_count, arrest_warrant, return_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `;
    const values = [
      fullName, dateOfBirth, citizenId, passportNo || null,
      address, photoUrl, caseIdCount || 0, arrestWarrant, returnDate
    ];

    const result = await client.query(query, values);
    await client.query("COMMIT");

    res.status(201).json({ success: true, data: result.rows[0], message: "บันทึกข้อมูลส่งกลับสำเร็จ" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create Deported Error:", err.message);
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  } finally {
    client.release();
  }
};