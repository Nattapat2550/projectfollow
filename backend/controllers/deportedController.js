// backend/controllers/deportedController.js

const pool = require("../config/db"); // ใช้ Pool ที่จูนออปชันแล้ว
const { v4: uuidv4 } = require("uuid"); // ใช้สร้าง ID
const { uploadToDrive, deleteFromDrive, extractDriveFileId } = require("../services/googleDriveService");
const { safeParseDate } = require("../utils/immigrantHelpers");

exports.getDeportedById = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM deported_persons WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Not found" });
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
};

exports.createDeported = async (req, res) => {
  try {
    const data = req.body;
    if (!data.first_name_th || !data.last_name_th || !data.national_id) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน" });
    }

    // ตรวจสอบข้อมูลซ้ำ
    if (data.national_id) {
      const existingNat = await pool.query("SELECT id FROM deported_persons WHERE national_id = $1", [data.national_id]);
      if (existingNat.rows.length > 0) return res.status(400).json({ success: false, message: "เลขประจำตัว (national_id) นี้มีอยู่ในระบบแล้ว" });
    }

    if (data.passport_id) {
      const existingPass = await pool.query("SELECT id FROM deported_persons WHERE passport_id = $1", [data.passport_id]);
      if (existingPass.rows.length > 0) return res.status(400).json({ success: false, message: "เลขหนังสือเดินทาง (passport_id) นี้มีอยู่ในระบบแล้ว" });
    }

    let photo_url = null;
    if (req.file) {
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const id = uuidv4();
    const query = `
      INSERT INTO deported_persons 
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, 
       date_of_birth, national_id, passport_id, gender, address, channel, result, number_of_case, number_of_warrant, age, return_date, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *;
    `;
    const values = [
      id, data.first_name_th, data.middle_name_th || null, data.last_name_th,
      data.first_name_en || null, data.middle_name_en || null, data.last_name_en || null,
      safeParseDate(data.date_of_birth), data.national_id, data.passport_id || null, data.gender || null,
      data.address || "ไม่ระบุ", data.channel || null, data.result || "PENDING",
      parseInt(data.number_of_case) || 0, parseInt(data.number_of_warrant) || 0,
      parseInt(data.age) || null, safeParseDate(data.return_date), photo_url
    ];

    const result = await pool.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0], message: "บันทึกข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.updateDeported = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existingDataRes = await pool.query("SELECT * FROM deported_persons WHERE id = $1", [id]);
    if (existingDataRes.rows.length === 0) return res.status(404).json({ success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
    const existingData = existingDataRes.rows[0];

    let photo_url = existingData.photo_url;
    if (req.file) {
      if (existingData.photo_url) {
        const oldFileId = extractDriveFileId(existingData.photo_url);
        if (oldFileId) { try { await deleteFromDrive(oldFileId); } catch (e) { } }
      }
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const query = `
      UPDATE deported_persons SET 
        first_name_th=$1, middle_name_th=$2, last_name_th=$3, first_name_en=$4, middle_name_en=$5, last_name_en=$6, 
        date_of_birth=$7, national_id=$8, passport_id=$9, gender=$10, address=$11, channel=$12, result=$13, 
        number_of_case=$14, number_of_warrant=$15, age=$16, return_date=$17, photo_url=$18
      WHERE id=$19 RETURNING *;
    `;
    const values = [
      data.first_name_th, data.middle_name_th || null, data.last_name_th,
      data.first_name_en || null, data.middle_name_en || null, data.last_name_en || null,
      safeParseDate(data.date_of_birth), data.national_id, data.passport_id || null, data.gender || null,
      data.address || "ไม่ระบุ", data.channel || null, data.result || "PENDING",
      parseInt(data.number_of_case) || 0, parseInt(data.number_of_warrant) || 0,
      parseInt(data.age) || null, safeParseDate(data.return_date), photo_url, id
    ];

    const result = await pool.query(query, values);
    res.status(200).json({ success: true, data: result.rows[0], message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.deleteDeported = async (req, res) => {
  try {
    const { id } = req.params;
    const existingDataRes = await pool.query("SELECT photo_url FROM deported_persons WHERE id = $1", [id]);
    
    if (existingDataRes.rows.length > 0 && existingDataRes.rows[0].photo_url) {
       const fileId = extractDriveFileId(existingDataRes.rows[0].photo_url);
       if(fileId) { try { await deleteFromDrive(fileId); } catch(e) {} }
    }
    
    await pool.query("DELETE FROM deported_persons WHERE id = $1", [id]);
    res.status(200).json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};