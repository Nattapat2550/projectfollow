const pool = require("../config/db");
const { v4: uuidv4 } = require("uuid"); 

exports.getAllData = async (req, res) => {
  try {
    const illegals = await pool.query(`SELECT * FROM illegal_immigrants ORDER BY id DESC`);
    const deporteds = await pool.query(`SELECT * FROM deported_persons ORDER BY id DESC`);

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

exports.createIllegal = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const id = uuidv4();
    
    // รับฟิลด์ตามเอกสาร
    const {
      first_name_th, middle_name_th, last_name_th,
      first_name_en, middle_name_en, last_name_en,
      nationality, passport_id, detected_location, 
      is_victim, gender, detected_date
    } = req.body;

    const query = `
      INSERT INTO illegal_immigrants 
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, 
       nationality, passport_id, detected_location, is_victim, gender, detected_date) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
    `;
    const values = [
      id, first_name_th, middle_name_th || null, last_name_th,
      first_name_en || null, middle_name_en || null, last_name_en || null,
      nationality || null, passport_id || null, detected_location, 
      is_victim || false, gender || null, detected_date || null
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

exports.createDeported = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const id = uuidv4();

    // รับฟิลด์ตามเอกสาร (ช่องทางมา, อายุคำนวณมา, etc.)
    const {
      first_name_th, middle_name_th, last_name_th,
      first_name_en, middle_name_en, last_name_en,
      date_of_birth, national_id, passport_id,
      address, number_of_case, number_of_warrant,
      return_date, channel, age
    } = req.body;
    
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const query = `
      INSERT INTO deported_persons 
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, 
       date_of_birth, national_id, passport_id, address, number_of_case, number_of_warrant, photo_url, return_date, channel, age) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *
    `;
    const values = [
      id, first_name_th, middle_name_th || null, last_name_th,
      first_name_en || null, middle_name_en || null, last_name_en || null,
      date_of_birth, national_id, passport_id || null, address, 
      number_of_case || 0, number_of_warrant || 0, photoUrl, 
      return_date || null, channel || null, age || null
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