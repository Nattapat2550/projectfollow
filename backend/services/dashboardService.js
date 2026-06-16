const { convertBEtoAD } = require("../utils/immigrantHelpers");

exports.buildDashboardQuery = (query, type) => {
  const { search, sortBy, sortOrder, startDate, endDate, dobStart, dobEnd } = query;
  
  const sDate = convertBEtoAD(startDate);
  const eDate = convertBEtoAD(endDate);
  const vStart = sDate && sDate.trim() !== "";
  const vEnd = eDate && eDate.trim() !== "";

  const dStart = convertBEtoAD(dobStart);
  const dEnd = convertBEtoAD(dobEnd);
  const vDobStart = dStart && dStart.trim() !== "";
  const vDobEnd = dEnd && dEnd.trim() !== "";

  let whereCondition = { AND: [] };

  if (vStart || vEnd) {
    const dateField = type === "deported" ? "return_date" : "detected_date";
    let dateFilter = {};
    if (vStart) dateFilter.gte = new Date(`${sDate}T00:00:00.000Z`);
    if (vEnd) dateFilter.lte = new Date(`${eDate}T23:59:59.999Z`);
    whereCondition.AND.push({ [dateField]: dateFilter });
  }

  if (vDobStart || vDobEnd) {
    let dobFilter = {};
    if (vDobStart) dobFilter.gte = new Date(`${dStart}T00:00:00.000Z`);
    if (vDobEnd) dobFilter.lte = new Date(`${dEnd}T23:59:59.999Z`);
    whereCondition.AND.push({ date_of_birth: dobFilter });
  }

  if (search && search.trim() !== "") {
    const keywords = search.trim().split(/\s+/);
    const searchConditions = keywords.map((keyword) => {
      const searchFields = [
        { first_name_th: { contains: keyword, mode: "insensitive" } },
        { last_name_th: { contains: keyword, mode: "insensitive" } },
        { first_name_en: { contains: keyword, mode: "insensitive" } },
        { last_name_en: { contains: keyword, mode: "insensitive" } },
        { passport_id: { contains: keyword, mode: "insensitive" } },
      ];
      if (type === "deported") {
        searchFields.push({ national_id: { contains: keyword, mode: "insensitive" } });
        searchFields.push({ channel: { contains: keyword, mode: "insensitive" } });
      } else {
        searchFields.push({ nationality: { contains: keyword, mode: "insensitive" } });
        searchFields.push({ detected_location: { contains: keyword, mode: "insensitive" } });
      }
      return { OR: searchFields };
    });
    whereCondition.AND.push(...searchConditions);
  }
  
  if (whereCondition.AND.length === 0) whereCondition = {};

  let orderByCondition = {};
  const order = sortOrder === "desc" ? "desc" : "asc";
  if (sortBy && sortBy.trim() !== "") {
    if (sortBy === "name") orderByCondition = [{ first_name_th: order }, { last_name_th: order }];
    else orderByCondition = { [sortBy]: order };
  } else {
    orderByCondition = type === "deported" ? { return_date: "desc" } : { detected_date: "desc" };
  }

  return { whereCondition, orderByCondition };
};