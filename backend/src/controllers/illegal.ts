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

import * as schema from "../schema/illegal";
import { error } from "../utils/errors";
import { buildDataQuerySQL } from "../services/data";

export async function getAllIllegal(
  query: Partial<schema.GetAllIllegalRequestQuery>,
): Promise<schema.GetAllIllegalResponse> {
  const {
    creator,
    dobEnd: rawDobEnd,
    dobStart: rawDobStart,
    startDate: rawStartDate,
    endDate: rawEndDate,
    search,
    sortBy,
    sortOrder,
  } = query;

  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;
  const offset = (page - 1) * limit;

  const cacheKey = `getAllIllegal_page_${page}_limit_${limit}_${JSON.stringify(query)}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) return cachedData;

  const { whereClause, params, orderClause } = buildDataQuerySQL(
    {
      creator,
      rawDobStart,
      rawDobEnd,
      rawStartDate,
      rawEndDate,
      search,
      sortBy,
      sortOrder: sortOrder == "asc" ? "asc" : "desc",
    },
    "illegal",
  );
  const paramCount = params.length;

  const dataQuery = `
      SELECT t.*, u.name AS creator_name, u.color AS creator_color 
      FROM illegal_immigrants t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${whereClause} ${orderClause} 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

  const countQuery = `
      SELECT COUNT(t.id) 
      FROM illegal_immigrants t 
      LEFT JOIN users u ON t.created_by = u.id
      ${whereClause}
    `;

  const [dataRes, countRes] = await Promise.all([
    pool.query(dataQuery, [...params, limit, offset]),
    pool.query(countQuery, params),
  ]);

  const totalItems = parseInt(countRes.rows[0].count);

  const responsePayload: schema.GetAllIllegalResponse = {
    success: true,
    tableData: dataRes.rows,
    meta: {
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
      currentPage: page,
      limit: limit,
    },
  };

  cache.set(cacheKey, responsePayload);
  return responsePayload;
}

export async function getIllegalById(
  id: string,
): Promise<schema.GetIllegalByIdResponse> {
  const { rows } = await pool.query(
    `
    SELECT t.*, u.name AS creator_name, u.color AS creator_color
    FROM illegal_immigrants t
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.id = $1
`,
    [id],
  );
  if (rows.length === 0) return error(404, "Not found");

  return { success: true, data: rows[0] };
}

export async function createIllegal(
  body: Partial<schema.CreateIllegalRequest>,
  files: Partial<schema.CreateIllegalRequestFile>,
  user?: User,
): Promise<schema.CreateIllegalResponse> {
  const data = body;
  if (!data.first_name_th || !data.last_name_th)
    error(400, "กรุณาระบุชื่อและนามสกุลภาษาไทย");

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

  let passport_id = data.passport_id ? String(data.passport_id).trim() : null;
  if (passport_id === "") passport_id = null;

  let dob = safeParseDate(data.date_of_birth);
  if (!dob && data.age) {
    dob = calculateDOBFromAge(data.age);
  }

  const query = `
      INSERT INTO illegal_immigrants 
      (id, first_name_th, middle_name_th, last_name_th, first_name_en, middle_name_en, last_name_en, 
        passport_id, gender, nationality, date_of_birth, detected_location_details, detected_location_sub_district, detected_location_district, detected_location_province, detected_location_region, workplace, screening_details, is_victim, detected_date, note, photo_url, passport_photo_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *;
    `;
  const detected_location_region = getRegionFromProvince(
    data.detected_location_province,
  );
  const values = [
    id,
    data.first_name_th,
    data.middle_name_th || null,
    data.last_name_th,
    data.first_name_en || null,
    data.middle_name_en || null,
    data.last_name_en || null,
    passport_id,
    data.gender || null,
    data.nationality ? normalizeNationality(data.nationality) : null,
    dob,
    data.detected_location_details || "ไม่ระบุ",
    data.detected_location_sub_district || null,
    data.detected_location_district || null,
    data.detected_location_province || null,
    detected_location_region,
    data.workplace || null,
    data.screening_details || null,
    data.is_victim || "PENDING", // <-- ใช้เป็น PENDING เมื่อไม่มีการส่งค่ามาให้
    safeParseDate(data.detected_date),
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

export async function updateIllegal(
  id: string,
  body: Partial<schema.UpdateIllegalRequest>,
  files: Partial<schema.UpdateIllegalRequestFile>,
): Promise<schema.UpdateIllegalResponse> {
  const data = body;

  const existingDataRes = await pool.query(
    "SELECT * FROM illegal_immigrants WHERE id = $1",
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
          } catch (delErr) {
            console.error(delErr.message);
          }
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
          } catch (delErr) {
            console.error(delErr.message);
          }
        }
      }
      const driveRes = await uploadToDrive(
        files.passport_photo[0],
        process.env.GOOGLE_DRIVE_FOLDER_PASSPORT,
      );
      passport_photo_url = driveRes.webViewLink;
    }
  }

  let passport_id = data.passport_id ? String(data.passport_id).trim() : null;
  if (passport_id === "") passport_id = null;

  let dob = safeParseDate(data.date_of_birth);
  if (!dob && data.age) {
    dob = calculateDOBFromAge(data.age);
  }

  const query = `
      UPDATE illegal_immigrants SET 
        first_name_th=$1, middle_name_th=$2, last_name_th=$3, first_name_en=$4, middle_name_en=$5, last_name_en=$6, 
        passport_id=$7, gender=$8, nationality=$9, date_of_birth=$10, detected_location_details=$11, detected_location_sub_district=$12, detected_location_district=$13, detected_location_province=$14, detected_location_region=$15, workplace=$16, screening_details=$17, 
        is_victim=$18, detected_date=$19, note=$20, photo_url=$21, passport_photo_url=$22, updated_at=NOW()
      WHERE id=$23 RETURNING *;
    `;
  const detected_location_region = getRegionFromProvince(
    data.detected_location_province,
  );
  const values = [
    data.first_name_th,
    data.middle_name_th || null,
    data.last_name_th,
    data.first_name_en || null,
    data.middle_name_en || null,
    data.last_name_en || null,
    passport_id,
    data.gender || null,
    data.nationality ? normalizeNationality(data.nationality) : null,
    dob,
    data.detected_location_details || "ไม่ระบุ",
    data.detected_location_sub_district || null,
    data.detected_location_district || null,
    data.detected_location_province || null,
    detected_location_region,
    data.workplace || null,
    data.screening_details || null,
    data.is_victim || "PENDING", // <-- ใช้เป็น PENDING เมื่อไม่มีการส่งค่ามาให้
    safeParseDate(data.detected_date),
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

export async function deleteIllegal(
  id: string,
): Promise<schema.DeleteIllegalResponse> {
  const existingDataRes = await pool.query(
    "SELECT photo_url, passport_photo_url FROM illegal_immigrants WHERE id = $1",
    [id],
  );

  if (existingDataRes.rows.length > 0) {
    const row = existingDataRes.rows[0];
    if (row.photo_url) {
      const fileId = extractDriveFileId(row.photo_url);
      if (fileId) {
        try {
          await deleteFromDrive(fileId);
        } catch (e) {
          console.error(e);
        }
      }
    }
    if (row.passport_photo_url) {
      const fileId2 = extractDriveFileId(row.passport_photo_url);
      if (fileId2) {
        try {
          await deleteFromDrive(fileId2);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  await pool.query("DELETE FROM illegal_immigrants WHERE id = $1", [id]);
  cache.clear();
  return { success: true, message: "ลบข้อมูลสำเร็จ" };
}
