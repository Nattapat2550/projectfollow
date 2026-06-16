const { convertBEtoAD } = require("../utils/immigrantHelpers");

exports.buildDashboardQuerySQL = (query, type) => {
  const { search, sortBy, sortOrder, startDate, endDate, dobStart, dobEnd } = query;
  
  const sDate = convertBEtoAD(startDate);
  const eDate = convertBEtoAD(endDate);
  const dStart = convertBEtoAD(dobStart);
  const dEnd = convertBEtoAD(dobEnd);

  let conditions = [];
  let params = [];
  let paramIdx = 1;

  if (sDate || eDate) {
    const dateField = type === "deported" ? "return_date" : "detected_date";
    if (sDate && eDate) {
      conditions.push(`DATE(${dateField}) >= $${paramIdx} AND DATE(${dateField}) <= $${paramIdx + 1}`);
      params.push(sDate, eDate);
      paramIdx += 2;
    } else if (sDate) {
      conditions.push(`DATE(${dateField}) >= $${paramIdx}`);
      params.push(sDate);
      paramIdx++;
    } else if (eDate) {
      conditions.push(`DATE(${dateField}) <= $${paramIdx}`);
      params.push(eDate);
      paramIdx++;
    }
  }

  if (dStart || dEnd) {
    if (dStart && dEnd) {
      conditions.push(`DATE(date_of_birth) >= $${paramIdx} AND DATE(date_of_birth) <= $${paramIdx + 1}`);
      params.push(dStart, dEnd);
      paramIdx += 2;
    } else if (dStart) {
      conditions.push(`DATE(date_of_birth) >= $${paramIdx}`);
      params.push(dStart);
      paramIdx++;
    } else if (dEnd) {
      conditions.push(`DATE(date_of_birth) <= $${paramIdx}`);
      params.push(dEnd);
      paramIdx++;
    }
  }

  if (search && search.trim() !== "") {
    const keywords = search.trim().split(/\s+/);
    const searchConditions = keywords.map((keyword) => {
      const kw = `%${keyword}%`;
      let fields = `first_name_th ILIKE $${paramIdx} OR last_name_th ILIKE $${paramIdx} OR first_name_en ILIKE $${paramIdx} OR last_name_en ILIKE $${paramIdx} OR passport_id ILIKE $${paramIdx}`;
      
      if (type === "deported") {
        fields += ` OR national_id ILIKE $${paramIdx} OR channel ILIKE $${paramIdx}`;
      } else {
        fields += ` OR nationality ILIKE $${paramIdx} OR detected_location ILIKE $${paramIdx}`;
      }
      
      params.push(kw);
      const str = `(${fields})`;
      paramIdx++;
      return str;
    });
    conditions.push(`(${searchConditions.join(" AND ")})`);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderClause = "";
  const dir = sortOrder === "desc" ? "DESC" : "ASC";
  if (sortBy && sortBy.trim() !== "") {
    if (sortBy === "name") {
        orderClause = `ORDER BY first_name_th ${dir} NULLS LAST, last_name_th ${dir} NULLS LAST, id DESC`;
    } else {
        orderClause = `ORDER BY ${sortBy} ${dir} NULLS LAST, id DESC`;
    }
  } else {
    const defaultField = type === "deported" ? "return_date" : "detected_date";
    orderClause = `ORDER BY ${defaultField} DESC NULLS LAST, id DESC`;
  }

  return { whereClause, params, orderClause };
};