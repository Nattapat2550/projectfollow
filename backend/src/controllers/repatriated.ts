import pool from "../config/db";
import { v4 as uuidv4 } from "uuid";
import {
  uploadToDrive,
  deleteFromDrive,
  extractDriveFileId,
} from "../services/googleDriveService";
import {
  safeParseDate,
  normalizeNationality,
  calculateDOBFromAge,
} from "../utils/immigrantHelpers";
import { getRegionFromProvince } from "../utils/regionMapper";
import * as cache from "../utils/cache";

import * as schema from "../schema/repatriated";
import { Request } from "express";
import { error } from "../utils/errors";
import { ExpressFileFields } from "../utils/types";

export async function getRepatriatedById(
  id: string,
): Promise<schema.GetRepatriatedByIdResponse> {
  const { rows } = await pool.query(
    `
    SELECT t.*, u.name AS creator_name, u.color AS creator_color
    FROM repatriated_persons t
    LEFT JOIN users u ON t.created_by = u.id WHERE t.id = $1
    `,
    [id],
  );
  // เปลี่ยนจาก 404 เป็น 200 { success: false } เพื่อลดแจ้งเตือน 404 แดงๆ ใน Console ฝั่งผู้ใช้
  if (rows.length === 0) return { success: false, message: "Not found" };

  return { success: true, data: rows[0] };
}

export async function createRepatriated(
  body: Partial<schema.CreateRepatriatedRequest>,
  files: ExpressFileFields,
  user: User,
): Promise<schema.CreateRepatriatedResponse> {
  const data = body;
  if (!data.first_name_th || !data.last_name_th || !data.national_id) {
    return error(400, "ข้อมูลไม่ครบถ้วน");
  }

  if (data.national_id) {
    const existingNat = await pool.query(
      "SELECT id FROM repatriated_persons WHERE national_id = $1",
      [data.national_id],
    );
    if (existingNat.rows.length > 0)
      return error(400, "เลขประจำตัว (national_id) นี้มีอยู่ในระบบแล้ว");
  }

  if (data.passport_id) {
    const existingPass = await pool.query(
      "SELECT id FROM repatriated_persons WHERE passport_id = $1",
      [data.passport_id],
    );
    if (existingPass.rows.length > 0)
      return error(400, "เลขหนังสือเดินทาง (passport_id) นี้มีอยู่ในระบบแล้ว");
  }

  let photo_url = null;
  let passport_photo_url = null;
  if (files) {
    if (files.photo) {
      const driveRes = await uploadToDrive(
        files.photo[0],
        process.env.GOOGLE_DRIVE_FOLDER_ID,
      );
      photo_url = driveRes.webViewLink;
    }
    if (files.passport_photo) {
      const driveRes = await uploadToDrive(
        files.passport_photo[0],
        process.env.GOOGLE_DRIVE_FOLDER_PASSPORT,
      );
      passport_photo_url = driveRes.webViewLink;
    }
  }

  const created_by = user ? user.id : null;
  const id = uuidv4();

  // ตาราง repatriated_persons ไม่มีคอลัมน์ age — ถ้าไม่ระบุวันเกิดให้คำนวณจากอายุแทน (เหมือนฝั่ง illegal)
  let dob = safeParseDate(data.date_of_birth);
  if (!dob && data.age) dob = calculateDOBFromAge(data.age);

  const query = `
      INSERT INTO repatriated_persons
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en,
       passport_id, nationality, national_id, gender, date_of_birth, return_date, number_of_case,
       number_of_warrant, address_details, sub_district, district, province, region, building, floor, room, job_type,
       role, salary, paid_by, payment_method, is_victim, responsible_agency, screening_details, note, photo_url, passport_photo_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
      RETURNING *;
    `;
  const region = getRegionFromProvince(data.province);
  const values = [
    id,
    data.first_name_th,
    data.middle_name_th || null,
    data.last_name_th,
    data.first_name_en || null,
    data.middle_name_en || null,
    data.last_name_en || null,
    data.passport_id || null,
    data.nationality ? normalizeNationality(data.nationality) : null,
    data.national_id,
    data.gender || null,
    dob,
    safeParseDate(data.return_date),
    data.number_of_case ? parseInt(data.number_of_case) : 0,
    data.number_of_warrant ? parseInt(data.number_of_warrant) : 0,
    data.address_details || "ไม่ระบุ",
    data.sub_district || null,
    data.district || null,
    data.province || null,
    region,
    data.building || null,
    data.floor || null,
    data.room || null,
    data.job_type || null,
    data.role || null,
    data.salary || null,
    data.paid_by || null,
    data.payment_method || null,
    data.is_victim || "PENDING",
    data.responsible_agency || null,
    data.screening_details || null,
    data.note || null,
    photo_url,
    passport_photo_url,
    created_by,
  ];

  const result = await pool.query(query, values);
  cache.clear();
  return {
    success: true,
    data: result.rows[0],
    message: "บันทึกข้อมูลสำเร็จ",
  };
}

export async function updateRepatriated(
  id: string,
  body: schema.UpdateRepatriatedRequest,
  files: ExpressFileFields,
): Promise<schema.UpdateRepatriatedResponse> {
  const data = body;

  const existingDataRes = await pool.query(
    "SELECT * FROM repatriated_persons WHERE id = $1",
    [id],
  );
  if (existingDataRes.rows.length === 0)
    error(404, "ไม่พบข้อมูลที่ต้องการแก้ไข");
  const existingData = existingDataRes.rows[0];

  let photo_url = existingData.photo_url;
  let passport_photo_url = existingData.passport_photo_url;

  if (files) {
    if (files.photo) {
      if (existingData.photo_url) {
        const oldFileId = extractDriveFileId(existingData.photo_url);
        if (oldFileId) {
          try {
            await deleteFromDrive(oldFileId);
          } catch (e) {}
        }
      }
      const driveRes = await uploadToDrive(
        files.photo[0],
        process.env.GOOGLE_DRIVE_FOLDER_ID,
      );
      photo_url = driveRes.webViewLink;
    }

    if (files.passport_photo) {
      if (existingData.passport_photo_url) {
        const oldFileId = extractDriveFileId(existingData.passport_photo_url);
        if (oldFileId) {
          try {
            await deleteFromDrive(oldFileId);
          } catch (e) {}
        }
      }
      const driveRes = await uploadToDrive(
        files.passport_photo[0],
        process.env.GOOGLE_DRIVE_FOLDER_PASSPORT,
      );
      passport_photo_url = driveRes.webViewLink;
    }
  }

  // ตาราง repatriated_persons ไม่มีคอลัมน์ age — ถ้าไม่ระบุวันเกิดให้คำนวณจากอายุแทน (เหมือนฝั่ง illegal)
  let dob = safeParseDate(data.date_of_birth);
  if (!dob && data.age) dob = calculateDOBFromAge(data.age);

  const query = `
      UPDATE repatriated_persons SET
        first_name_th=$1, middle_name_th=$2, last_name_th=$3, first_name_en=$4, middle_name_en=$5, last_name_en=$6,
        passport_id=$7, nationality=$8, national_id=$9, gender=$10, date_of_birth=$11, return_date=$12,
        number_of_case=$13, number_of_warrant=$14,
        address_details=$15, sub_district=$16, district=$17, province=$18, region=$19, building=$20, floor=$21, room=$22, job_type=$23,
        role=$24, salary=$25, paid_by=$26, payment_method=$27, is_victim=$28, responsible_agency=$29,
        screening_details=$30, note=$31, photo_url=$32, passport_photo_url=$33, updated_at=NOW()
      WHERE id=$34 RETURNING *;
    `;
  const region = getRegionFromProvince(data.province);
  const values = [
    data.first_name_th,
    data.middle_name_th || null,
    data.last_name_th,
    data.first_name_en || null,
    data.middle_name_en || null,
    data.last_name_en || null,
    data.passport_id || null,
    data.nationality ? normalizeNationality(data.nationality) : null,
    data.national_id,
    data.gender || null,
    dob,
    safeParseDate(data.return_date),
    data.number_of_case ? parseInt(data.number_of_case) : 0,
    data.number_of_warrant ? parseInt(data.number_of_warrant) : 0,
    data.address_details || "ไม่ระบุ",
    data.sub_district || null,
    data.district || null,
    data.province || null,
    region,
    data.building || null,
    data.floor || null,
    data.room || null,
    data.job_type || null,
    data.role || null,
    data.salary || null,
    data.paid_by || null,
    data.payment_method || null,
    data.is_victim || "PENDING",
    data.responsible_agency || null,
    data.screening_details || null,
    data.note || null,
    photo_url,
    passport_photo_url,
    id,
  ];

  const result = await pool.query(query, values);
  cache.clear();
  return {
    success: true,
    data: result.rows[0],
    message: "แก้ไขข้อมูลสำเร็จ",
  };
}

export async function deleteRepatriated(
  id: string,
): Promise<schema.DeleteRepatriatedResponse> {
  const existingDataRes = await pool.query(
    "SELECT photo_url, passport_photo_url FROM repatriated_persons WHERE id = $1",
    [id],
  );

  if (existingDataRes.rows.length > 0) {
    const row = existingDataRes.rows[0];
    if (row.photo_url) {
      const fileId = extractDriveFileId(row.photo_url);
      if (fileId) {
        try {
          await deleteFromDrive(fileId);
        } catch (e) {}
      }
    }
    if (row.passport_photo_url) {
      const fileId2 = extractDriveFileId(row.passport_photo_url);
      if (fileId2) {
        try {
          await deleteFromDrive(fileId2);
        } catch (e) {}
      }
    }
  }

  await pool.query("DELETE FROM repatriated_persons WHERE id = $1", [id]);
  cache.clear();
  return { success: true, message: "ลบข้อมูลสำเร็จ" };
}
