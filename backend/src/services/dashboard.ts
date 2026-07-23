import { PersonType } from "../schema/dashboard";

type ChartsQuery = Record<
  | "genderChartQuery"
  | "natChartQuery"
  | "creatorChartQuery"
  | "provinceChartQuery"
  | "regionChartQuery"
  | "ageChartQuery"
  | "victimChartQuery"
  | "dateTrendQuery",
  string
>;

type MetaQuery = Record<
  | "allNatsResQuery"
  | "allGendersResQuery"
  | "allCreatorsResQuery"
  | "allProvincesResQuery"
  | "allRegionsResQuery",
  string
>;

type StatsQuery = Record<"victimCountQuery", string>;

type R<T extends PersonType> = T extends "illegal"
  ? {
      charts: ChartsQuery & Record<"passportChartQuery", string>;
      meta: MetaQuery;
      stats: StatsQuery & Record<"passportCountQuery", string>;
    }
  : {
      charts: ChartsQuery;
      meta: MetaQuery;
      stats: StatsQuery;
    };

export function buildDashboardQuerySQL<T extends PersonType>(
  baseWhere: string,
  type: T,
): R<T> {
  let tableName =
    type === "repatriated" ? "repatriated_persons" : "illegal_immigrants";
  let dateField = type === "repatriated" ? "return_date" : "detected_date";
  const provField =
    type === "repatriated" ? "province" : "detected_location_province";
  const regField =
    type === "repatriated" ? "region" : "detected_location_region";

  const genderChartQuery = `
      SELECT 
        CASE 
          WHEN t.gender IS NULL OR TRIM(t.gender) = '' THEN 'ไม่ระบุ' 
          ELSE t.gender 
        END as name, 
        COUNT(*) as value 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${baseWhere} 
      GROUP BY 1 
      ORDER BY value DESC
    `;

  const natChartQuery = `SELECT COALESCE(t.nationality, 'ไม่ระบุ') as name, COUNT(*) as value FROM ${tableName} t LEFT JOIN users u ON t.created_by = u.id ${baseWhere} GROUP BY 1 ORDER BY value DESC LIMIT 6`;

  const creatorChartQuery = `
      SELECT 
        COALESCE(u.name, 'ไม่ทราบผู้เพิ่ม') as name, 
        u.color as color, 
        COUNT(*) as value 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${baseWhere} 
      GROUP BY u.name, u.color 
      ORDER BY value DESC 
      LIMIT 10
    `;

  const provinceChartQuery = `
      SELECT 
        COALESCE(NULLIF(TRIM(t.${provField}), ''), 'ไม่ระบุ') as name, 
        COUNT(*) as value 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${baseWhere} 
      GROUP BY 1 
      ORDER BY value DESC 
      LIMIT 6
    `;

  const regionChartQuery = `
      SELECT 
        COALESCE(NULLIF(TRIM(t.${regField}), ''), 'ไม่ระบุ') as name, 
        COUNT(*) as value 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${baseWhere} 
      GROUP BY 1 
      ORDER BY value DESC 
      LIMIT 6
    `;

  const ageChartQuery = `
      SELECT 
        CASE 
          WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, t.date_of_birth)) <= 18 THEN '0-18 ปี'
          WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, t.date_of_birth)) BETWEEN 19 AND 30 THEN '19-30 ปี'
          WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, t.date_of_birth)) BETWEEN 31 AND 50 THEN '31-50 ปี'
          WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, t.date_of_birth)) >= 51 THEN '51 ปีขึ้นไป'
          ELSE 'ไม่ระบุ'
        END as name, COUNT(*) as value
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${baseWhere} 
      GROUP BY 1 ORDER BY value DESC
    `;

  const victimChartQuery = `
      SELECT 
        CASE 
          WHEN t.is_victim = 'YES' THEN 'เป็นผู้เสียหาย' 
          WHEN t.is_victim = 'NO' THEN 'ไม่เป็นผู้เสียหาย'
          ELSE 'ไม่คัดกรองสถานะ' 
        END as name, 
        COUNT(*) as value 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${baseWhere} 
      GROUP BY 1 
      ORDER BY value DESC
    `;

  const dateTrendQuery = `
      SELECT TO_CHAR(DATE_TRUNC('month', t.${dateField}), 'Mon YYYY') as name, COUNT(*) as value
      FROM ${tableName} t LEFT JOIN users u ON t.created_by = u.id
      ${baseWhere ? baseWhere + " AND " : "WHERE "} t.${dateField} IS NOT NULL
      GROUP BY DATE_TRUNC('month', t.${dateField}), TO_CHAR(DATE_TRUNC('month', t.${dateField}), 'Mon YYYY')
      ORDER BY DATE_TRUNC('month', t.${dateField}) ASC
      LIMIT 12
    `;

  const allNatsResQuery = `SELECT DISTINCT COALESCE(t.nationality, 'ไม่ระบุ') as nat FROM ${tableName} t WHERE t.nationality IS NOT NULL AND t.nationality != '' ORDER BY nat`;

  const allGendersResQuery = `
      SELECT DISTINCT
        CASE
          WHEN t.gender IS NULL OR TRIM(t.gender) = '' THEN 'ไม่ระบุ'
          ELSE t.gender
        END as gen
      FROM ${tableName} t
      ORDER BY gen
    `;

  const allCreatorsResQuery = `SELECT DISTINCT u.name as creator FROM ${tableName} t JOIN users u ON t.created_by = u.id WHERE u.name IS NOT NULL ORDER BY u.name`;

  const allProvincesResQuery = `SELECT DISTINCT COALESCE(NULLIF(TRIM(t.${provField}), ''), 'ไม่ระบุ') as prov FROM ${tableName} t ORDER BY prov`;

  const allRegionsResQuery = `SELECT DISTINCT COALESCE(NULLIF(TRIM(t.${regField}), ''), 'ไม่ระบุ') as reg FROM ${tableName} t ORDER BY reg`;

  const victimCountQuery = `SELECT COUNT(*) FROM ${tableName} t LEFT JOIN users u ON t.created_by = u.id ${baseWhere ? baseWhere + " AND " : "WHERE "} t.is_victim = 'YES'`;

  const charts = {
    genderChartQuery,
    natChartQuery,
    creatorChartQuery,
    provinceChartQuery,
    regionChartQuery,
    ageChartQuery,
    victimChartQuery,
    dateTrendQuery,
  };

  const meta = {
    allNatsResQuery,
    allGendersResQuery,
    allCreatorsResQuery,
    allProvincesResQuery,
    allRegionsResQuery,
  };

  const stats = {
    victimCountQuery,
  };

  if (type === "illegal") {
    const passportValidCond = `t.passport_id IS NOT NULL AND t.passport_id ~ '\\S' AND LOWER(TRIM(t.passport_id)) NOT IN ('-', 'ไม่มี', 'ไม่ระบุ', 'none', 'n/a', 'null', 'ไม่มีหนังสือเดินทาง')`;
    const passportChartQuery = `SELECT CASE WHEN ${passportValidCond} THEN 'มีหนังสือเดินทาง' ELSE 'ไม่มีข้อมูล / ไม่มี' END as name, COUNT(*) as value FROM illegal_immigrants t LEFT JOIN users u ON t.created_by = u.id ${baseWhere} GROUP BY 1 ORDER BY value DESC`;
    const passportCountQuery = `SELECT COUNT(*) FROM illegal_immigrants t LEFT JOIN users u ON t.created_by = u.id ${baseWhere ? baseWhere + " AND " : "WHERE "} ${passportValidCond}`;

    return {
      charts: { ...charts, passportChartQuery },
      meta,
      stats: { ...stats, passportCountQuery },
    } as R<T>;
  } else {
    return {
      charts,
      meta,
      stats,
    } as R<T>;
  }
}
