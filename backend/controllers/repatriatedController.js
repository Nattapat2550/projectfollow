const pool = require("../config/db"); 
const { v4: uuidv4 } = require("uuid"); 
const { uploadToDrive, deleteFromDrive, extractDriveFileId } = require("../services/googleDriveService");
const { safeParseDate } = require("../utils/immigrantHelpers");
const cache = require("../utils/cache");

exports.getRepatriatedById = async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT t.*, u.name AS creator_name, u.color AS creator_color FROM repatriated_persons t LEFT JOIN users u ON t.created_by = u.id WHERE t.id = $1", [req.params.id]);
    // เปลี่ยนจาก 404 เป็น 200 { success: false } เพื่อลดแจ้งเตือน 404 แดงๆ ใน Console ฝั่งผู้ใช้
    if (rows.length === 0) return res.status(200).json({ success: false, message: "Not found" });
    
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) { 
    res.status(500).json({ success: false, error: err.message }); 
  }
};

exports.createRepatriated = async (req, res) => {
  try {
    const data = req.body;
    if (!data.first_name_th || !data.last_name_th || !data.national_id) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน" });
    }

    if (data.national_id) {
      const existingNat = await pool.query("SELECT id FROM repatriated_persons WHERE national_id = $1", [data.national_id]);
      if (existingNat.rows.length > 0) return res.status(400).json({ success: false, message: "เลขประจำตัว (national_id) นี้มีอยู่ในระบบแล้ว" });
    }

    if (data.passport_id) {
      const existingPass = await pool.query("SELECT id FROM repatriated_persons WHERE passport_id = $1", [data.passport_id]);
      if (existingPass.rows.length > 0) return res.status(400).json({ success: false, message: "เลขหนังสือเดินทาง (passport_id) นี้มีอยู่ในระบบแล้ว" });
    }

    let photo_url = null;
    let passport_photo_url = null;
    if (req.files) {
      if (req.files.photo) {
        const driveRes = await uploadToDrive(req.files.photo[0], process.env.GOOGLE_DRIVE_FOLDER_ID);
        photo_url = driveRes.webViewLink;
      }
      if (req.files.passport_photo) {
        const driveRes = await uploadToDrive(req.files.passport_photo[0], process.env.GOOGLE_DRIVE_FOLDER_PASSPORT);
        passport_photo_url = driveRes.webViewLink;
      }
    }

    const created_by = req.user ? req.user.id : null;
    const id = uuidv4();

    const query = `
      INSERT INTO repatriated_persons 
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, 
       passport_id, nationality, national_id, gender, age, date_of_birth, return_date, number_of_case, 
       number_of_warrant, channel, result, address_details, sub_district, district, province, building, floor, room, job_type, 
       role, salary, paid_by, payment_method, victim_indicator, responsible_agency, note, photo_url, passport_photo_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
      RETURNING *;
    `;
    const values = [
      id, data.first_name_th, data.middle_name_th || null, data.last_name_th,
      data.first_name_en || null, data.middle_name_en || null, data.last_name_en || null,
      data.passport_id || null, data.nationality ? normalizeNationality(data.nationality) : null,
      data.national_id, data.gender || null, 
      data.age ? parseInt(data.age) : null, 
      safeParseDate(data.date_of_birth), 
      safeParseDate(data.return_date),
      data.number_of_case ? parseInt(data.number_of_case) : 0,
      data.number_of_warrant ? parseInt(data.number_of_warrant) : 0,
      data.channel || null, data.result || "PENDING",
      data.address_details || "ไม่ระบุ", data.sub_district || null, data.district || null, data.province || null, 
      data.building || null, data.floor || null, data.room || null,
      data.job_type || null, data.role || null, data.salary || null, 
      data.paid_by || null, data.payment_method || null,
      data.victim_indicator === "true" || data.victim_indicator === true || false,
      data.responsible_agency || null, data.note || null, photo_url, passport_photo_url, created_by
    ];

    const result = await pool.query(query, values);
    cache.clear();
    res.status(201).json({ success: true, data: result.rows[0], message: "บันทึกข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.updateRepatriated = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const existingDataRes = await pool.query("SELECT * FROM repatriated_persons WHERE id = $1", [id]);
    if (existingDataRes.rows.length === 0) return res.status(404).json({ success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
    const existingData = existingDataRes.rows[0];

    let photo_url = existingData.photo_url;
    let passport_photo_url = existingData.passport_photo_url;
    
    if (req.files) {
      if (req.files.photo) {
        if (existingData.photo_url) {
          const oldFileId = extractDriveFileId(existingData.photo_url);
          if (oldFileId) { try { await deleteFromDrive(oldFileId); } catch (e) { } }
        }
        const driveRes = await uploadToDrive(req.files.photo[0], process.env.GOOGLE_DRIVE_FOLDER_ID);
        photo_url = driveRes.webViewLink;
      }
      
      if (req.files.passport_photo) {
        if (existingData.passport_photo_url) {
          const oldFileId = extractDriveFileId(existingData.passport_photo_url);
          if (oldFileId) { try { await deleteFromDrive(oldFileId); } catch (e) { } }
        }
        const driveRes = await uploadToDrive(req.files.passport_photo[0], process.env.GOOGLE_DRIVE_FOLDER_PASSPORT);
        passport_photo_url = driveRes.webViewLink;
      }
    }

    const query = `
      UPDATE repatriated_persons SET 
        first_name_th=$1, middle_name_th=$2, last_name_th=$3, first_name_en=$4, middle_name_en=$5, last_name_en=$6, 
        passport_id=$7, nationality=$8, national_id=$9, gender=$10, age=$11, date_of_birth=$12, return_date=$13, 
        number_of_case=$14, number_of_warrant=$15, channel=$16, result=$17, 
        address_details=$18, sub_district=$19, district=$20, province=$21, building=$22, floor=$23, room=$24, job_type=$25, 
        role=$26, salary=$27, paid_by=$28, payment_method=$29, victim_indicator=$30, responsible_agency=$31, 
        note=$32, photo_url=$33, passport_photo_url=$34, updated_at=NOW()
      WHERE id=$35 RETURNING *;
    `;
    const values = [
      data.first_name_th, data.middle_name_th || null, data.last_name_th,
      data.first_name_en || null, data.middle_name_en || null, data.last_name_en || null,
      data.passport_id || null, data.nationality ? normalizeNationality(data.nationality) : null,
      data.national_id, data.gender || null, 
      data.age ? parseInt(data.age) : null, 
      safeParseDate(data.date_of_birth), 
      safeParseDate(data.return_date),
      data.number_of_case ? parseInt(data.number_of_case) : 0,
      data.number_of_warrant ? parseInt(data.number_of_warrant) : 0,
      data.channel || null, data.result || "PENDING",
      data.address_details || "ไม่ระบุ", data.sub_district || null, data.district || null, data.province || null,
      data.building || null, data.floor || null, data.room || null,
      data.job_type || null, data.role || null, data.salary || null, 
      data.paid_by || null, data.payment_method || null,
      data.victim_indicator === "true" || data.victim_indicator === true || false,
      data.responsible_agency || null, data.note || null, photo_url, passport_photo_url, id
    ];

    const result = await pool.query(query, values);
    cache.clear();
    res.status(200).json({ success: true, data: result.rows[0], message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.deleteRepatriated = async (req, res) => {
  try {
    const { id } = req.params;
    const existingDataRes = await pool.query("SELECT photo_url, passport_photo_url FROM repatriated_persons WHERE id = $1", [id]);
    
    if (existingDataRes.rows.length > 0) {
       const row = existingDataRes.rows[0];
       if (row.photo_url) {
           const fileId = extractDriveFileId(row.photo_url);
           if(fileId) { try { await deleteFromDrive(fileId); } catch(e) {} }
       }
       if (row.passport_photo_url) {
           const fileId2 = extractDriveFileId(row.passport_photo_url);
           if(fileId2) { try { await deleteFromDrive(fileId2); } catch(e) {} }
       }
    }
    
    await pool.query("DELETE FROM repatriated_persons WHERE id = $1", [id]);
    cache.clear();
    res.status(200).json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};