import pool from "../config/db";
import { convertBEtoAD } from "../utils/immigrantHelpers";

export function buildDataQuerySQL(
  query: {
    rawStartDate: string;
    rawEndDate: string;
    rawDobStart?: string;
    rawDobEnd?: string;
    search?: string;
    nationality?: string;
    province?: string;
    region?: string;
    gender?: string;
    isVictim?: string;
    hasPassport?: string;
    creator?: string;
    ageGroup?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
  type: "illegal" | "repatriated",
) {
  const {
    rawStartDate,
    rawEndDate,
    rawDobStart,
    rawDobEnd,
    search,
    nationality,
    gender,
    province,
    region,
    isVictim,
    hasPassport,
    creator,
    ageGroup,
    sortBy,
    sortOrder,
  } = query;

  const startDate = convertBEtoAD(rawStartDate);
  const endDate = convertBEtoAD(rawEndDate);
  const dobStart = convertBEtoAD(rawDobStart);
  const dobEnd = convertBEtoAD(rawDobEnd);

  const vStart = Boolean(startDate);
  const vEnd = Boolean(endDate);
  const vDobStart = Boolean(dobStart);
  const vDobEnd = Boolean(dobEnd);

  let conditions = [];
  let params = [];
  let paramIdx = 1;

  let dateField = type === "repatriated" ? "return_date" : "detected_date";

  if (vStart && vEnd) {
    conditions.push(
      `DATE(t.${dateField}) >= $${paramIdx} AND DATE(t.${dateField}) <= $${paramIdx + 1}`,
    );
    params.push(startDate, endDate);
    paramIdx += 2;
  } else if (vStart) {
    conditions.push(`DATE(t.${dateField}) >= $${paramIdx}`);
    params.push(startDate);
    paramIdx++;
  } else if (vEnd) {
    conditions.push(`DATE(t.${dateField}) <= $${paramIdx}`);
    params.push(endDate);
    paramIdx++;
  }
  if (type === "repatriated") {
    if (vDobStart && vDobEnd) {
      conditions.push(
        `DATE(t.date_of_birth) >= $${paramIdx} AND DATE(t.date_of_birth) <= $${paramIdx + 1}`,
      );
      params.push(dobStart, dobEnd);
      paramIdx += 2;
    } else if (vDobStart) {
      conditions.push(`DATE(t.date_of_birth) >= $${paramIdx}`);
      params.push(dobStart);
      paramIdx++;
    } else if (vDobEnd) {
      conditions.push(`DATE(t.date_of_birth) <= $${paramIdx}`);
      params.push(dobEnd);
      paramIdx++;
    }
  }

  if (nationality && nationality !== "ทั้งหมด") {
    conditions.push(`t.nationality = $${paramIdx}`);
    params.push(nationality);
    paramIdx++;
  }

  if (province && province !== "ทั้งหมด") {
    const provField =
      type === "repatriated" ? "t.province" : "t.detected_location_province";
    if (province === "ไม่ระบุ") {
      conditions.push(
        `(${provField} IS NULL OR TRIM(${provField}) = '' OR ${provField} = 'ไม่ระบุ')`,
      );
    } else {
      conditions.push(`${provField} = $${paramIdx}`);
      params.push(province);
      paramIdx++;
    }
  }

  if (region && region !== "ทั้งหมด") {
    const regField =
      type === "repatriated" ? "t.region" : "t.detected_location_region";
    if (region === "ไม่ระบุ") {
      conditions.push(
        `(${regField} IS NULL OR TRIM(${regField}) = '' OR ${regField} = 'ไม่ระบุ')`,
      );
    } else {
      conditions.push(`${regField} = $${paramIdx}`);
      params.push(region);
      paramIdx++;
    }
  }

  // เงื่อนไข Filter เพศ ที่รองรับ "ไม่ระบุ"
  if (gender && gender !== "ทั้งหมด") {
    if (gender === "ไม่ระบุ") {
      conditions.push(
        `(t.gender IS NULL OR TRIM(t.gender) = '' OR t.gender = 'ไม่ระบุ')`,
      );
    } else {
      conditions.push(`t.gender = $${paramIdx}`);
      params.push(gender);
      paramIdx++;
    }
  }

  // 🟢 ปรับแก้การรับค่า is_victim ให้รองรับรูปแบบเดิมที่ Frontend อาจจะส่งมาเป็น "true"/"false" หรือส่งมาเป็น ENUM โดยตรง
  if (isVictim) {
    if (isVictim === "true" || isVictim === "YES") {
      conditions.push(`t.is_victim = $${paramIdx}`);
      params.push("YES");
      paramIdx++;
    } else if (isVictim === "false" || isVictim === "NO") {
      conditions.push(`t.is_victim = $${paramIdx}`);
      params.push("NO");
      paramIdx++;
    } else if (isVictim === "PENDING") {
      conditions.push(`t.is_victim = $${paramIdx}`);
      params.push("PENDING");
      paramIdx++;
    }
  }

  if (type === "illegal") {
    if (hasPassport === "true") {
      conditions.push(
        `t.passport_id IS NOT NULL AND t.passport_id ~ '\\S' AND LOWER(TRIM(t.passport_id)) NOT IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง')`,
      );
    } else if (hasPassport === "false") {
      conditions.push(
        `(t.passport_id IS NULL OR TRIM(t.passport_id) = '' OR LOWER(TRIM(t.passport_id)) IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง'))`,
      );
    }
  }

  if (creator && creator !== "ทั้งหมด") {
    conditions.push(`u.name = $${paramIdx}`);
    params.push(creator);
    paramIdx++;
  }

  if (ageGroup && ageGroup !== "ทั้งหมด") {
    if (ageGroup === "0-18 ปี") {
      conditions.push(
        `EXTRACT(YEAR FROM age(CURRENT_DATE, t.date_of_birth)) <= 18`,
      );
    } else if (ageGroup === "19-30 ปี") {
      conditions.push(
        `EXTRACT(YEAR FROM age(CURRENT_DATE, t.date_of_birth)) BETWEEN 19 AND 30`,
      );
    } else if (ageGroup === "31-50 ปี") {
      conditions.push(
        `EXTRACT(YEAR FROM age(CURRENT_DATE, t.date_of_birth)) BETWEEN 31 AND 50`,
      );
    } else if (ageGroup === "51 ปีขึ้นไป") {
      conditions.push(
        `EXTRACT(YEAR FROM age(CURRENT_DATE, t.date_of_birth)) >= 51`,
      );
    } else if (ageGroup === "ไม่ระบุ") {
      conditions.push(`t.date_of_birth IS NULL`);
    }
  }

  if (search && search.trim() !== "") {
    const keywords = search.trim().split(/\s+/);
    const searchConditions = keywords.map((keyword) => {
      const kw = `%${keyword}%`;
      let fields = `t.first_name_th ILIKE $${paramIdx} OR t.last_name_th ILIKE $${paramIdx} OR t.first_name_en ILIKE $${paramIdx} OR t.last_name_en ILIKE $${paramIdx} OR t.passport_id ILIKE $${paramIdx}`;

      if (type === "repatriated") {
        fields += ` OR t.national_id ILIKE $${paramIdx}`;
      } else {
        fields += ` OR t.nationality ILIKE $${paramIdx} OR t.detected_location_details ILIKE $${paramIdx} OR t.detected_location_sub_district ILIKE $${paramIdx} OR t.detected_location_district ILIKE $${paramIdx} OR t.detected_location_province ILIKE $${paramIdx}`;
      }

      params.push(kw);
      const str = `(${fields})`;
      paramIdx++;
      return str;
    });
    conditions.push(`(${searchConditions.join(" AND ")})`);
  }

  let whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

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
      const allowedColumns = [
        "nationality",
        "detected_date",
        "is_victim",
        "date_of_birth",
        "national_id",
        "return_date",
        "result",
      ];
      if (allowedColumns.includes(sortBy)) {
        orderClause = `ORDER BY t.${sortBy} ${dir} NULLS LAST, t.id DESC`;
      }
    }
  }

  return { whereClause, orderClause, params, paramIdx };
}
