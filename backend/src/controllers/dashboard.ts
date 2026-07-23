import pool from "../config/db";
import {
  DashboardStatsCharts,
  DashboardStatsMeta,
  DashboardStatsStats,
  GetDashboardStatsRequestQuery,
  GetDashboardStatsResponse,
} from "../schema/dashboard";
import { buildDashboardQuerySQL } from "../services/dashboard";
import { buildDataQuerySQL } from "../services/data";

export async function getIllegalDashboardStats(
  query: Partial<GetDashboardStatsRequestQuery>,
): Promise<GetDashboardStatsResponse<"illegal">> {
  const {
    nationality = "ทั้งหมด",
    province = "ทั้งหมด",
    region = "ทั้งหมด",
    gender = "ทั้งหมด",
    startDate: rawStartDate,
    endDate: rawEndDate,
    isVictim = "ทั้งหมด",
    hasPassport = "ทั้งหมด",
    creator = "ทั้งหมด",
    ageGroup = "ทั้งหมด",
    page = "1",
    limit = "50",
    sortBy,
    sortOrder = "asc",
  } = query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  const offset = (pageNum - 1) * limitNum;

  const {
    whereClause,
    orderClause,
    params: queryParams,
    paramIdx: paramIndex,
  } = buildDataQuerySQL(
    {
      rawEndDate,
      rawStartDate,
      ageGroup,
      creator,
      gender,
      hasPassport,
      isVictim,
      nationality,
      province,
      region,
      sortBy,
      sortOrder,
    },
    "illegal",
  );

  let tableName = "illegal_immigrants";

  const dataQuery = `
      SELECT t.*, u.name as creator_name 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${whereClause} 
      ${orderClause} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
  const tableData = await pool.query(dataQuery, [
    ...queryParams,
    limitNum,
    offset,
  ]);

  const totalCountQuery = `
      SELECT COUNT(*) 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${whereClause}
    `;
  const totalCountResult = await pool.query(totalCountQuery, queryParams);
  const totalItems = parseInt(totalCountResult.rows[0].count);

  let baseWhere = whereClause;
  let baseParams = queryParams;

  const {
    charts: chartsQuery,
    meta: metaQuery,
    stats: statsQuery,
  } = buildDashboardQuerySQL(baseWhere, "illegal");

  const [
    genderChartRes,
    natChartRes,
    creatorChartRes,
    provinceChartRes,
    regionChartRes,
    ageChartRes,
    victimChartRes,
    passportChartRes,
    dateTrendRes,
  ] = await Promise.all([
    pool.query(chartsQuery.genderChartQuery, baseParams),
    pool.query(chartsQuery.natChartQuery, baseParams),
    pool.query(chartsQuery.creatorChartQuery, baseParams),
    pool.query(chartsQuery.provinceChartQuery, baseParams),
    pool.query(chartsQuery.regionChartQuery, baseParams),
    pool.query(chartsQuery.ageChartQuery, baseParams),
    pool.query(chartsQuery.victimChartQuery, baseParams),
    pool.query(chartsQuery.passportChartQuery, baseParams),
    pool.query(chartsQuery.dateTrendQuery, baseParams),
  ]);

  const charts: DashboardStatsCharts<"illegal"> = {
    gender: genderChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    nationality: natChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    creator: creatorChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
      color: r.color,
    })),
    province: provinceChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    region: regionChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    ageGroup: ageChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    victim: victimChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    passport: passportChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    dateTrend: dateTrendRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
  };

  const [victimRes, passportRes] = await Promise.all([
    pool.query(statsQuery.victimCountQuery, baseParams),
    pool.query(statsQuery.passportCountQuery, baseParams),
  ]);

  const stats: DashboardStatsStats<"illegal"> = {
    total: totalItems,
    victims: parseInt(victimRes.rows[0].count),
    hasPassport: parseInt(passportRes.rows[0].count),
  };

  const [
    allNatsRes,
    allGendersRes,
    allCreatorsRes,
    allProvincesRes,
    allRegionsRes,
  ] = await Promise.all([
    pool.query(metaQuery.allNatsResQuery),
    pool.query(metaQuery.allGendersResQuery),
    pool.query(metaQuery.allCreatorsResQuery),
    pool.query(metaQuery.allProvincesResQuery),
    pool.query(metaQuery.allRegionsResQuery),
  ]);

  const meta: DashboardStatsMeta = {
    totalItems,
    totalPages: Math.ceil(totalItems / limitNum) || 1,
    currentPage: pageNum,
    allNationalities: ["ทั้งหมด", ...allNatsRes.rows.map((r) => r.nat)],
    allProvinces: ["ทั้งหมด", ...allProvincesRes.rows.map((r) => r.prov)],
    allRegions: ["ทั้งหมด", ...allRegionsRes.rows.map((r) => r.reg)],
    allGenders: ["ทั้งหมด", ...allGendersRes.rows.map((r) => r.gen)],
    allCreators: ["ทั้งหมด", ...allCreatorsRes.rows.map((r) => r.creator)],
  };

  return {
    success: true,
    tableData: tableData.rows,
    meta,
    stats,
    charts,
  };
}

export async function getRepatriatedDashboardStats(
  query: Partial<GetDashboardStatsRequestQuery>,
): Promise<GetDashboardStatsResponse<"repatriated">> {
  const {
    nationality = "ทั้งหมด",
    province = "ทั้งหมด",
    region = "ทั้งหมด",
    gender = "ทั้งหมด",
    startDate: rawStartDate,
    endDate: rawEndDate,
    dobStart: rawDobStart,
    dobEnd: rawDobEnd,
    isVictim = "ทั้งหมด",
    hasPassport = "ทั้งหมด",
    creator = "ทั้งหมด",
    ageGroup = "ทั้งหมด",
    page = "1",
    limit = "50",
    sortBy,
    sortOrder = "asc",
  } = query;

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  const offset = (pageNum - 1) * limitNum;

  const {
    whereClause,
    orderClause,
    params: queryParams,
    paramIdx: paramIndex,
  } = buildDataQuerySQL(
    {
      rawEndDate,
      rawStartDate,
      rawDobStart,
      rawDobEnd,
      ageGroup,
      creator,
      gender,
      hasPassport,
      isVictim,
      nationality,
      province,
      region,
      sortBy,
      sortOrder,
    },
    "repatriated",
  );

  let tableName = "repatriated_persons";

  const dataQuery = `
      SELECT t.*, u.name as creator_name 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${whereClause} 
      ${orderClause} 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
  const tableData = await pool.query(dataQuery, [
    ...queryParams,
    limitNum,
    offset,
  ]);

  const totalCountQuery = `
      SELECT COUNT(*) 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${whereClause}
    `;
  const totalCountResult = await pool.query(totalCountQuery, queryParams);
  const totalItems = parseInt(totalCountResult.rows[0].count);

  let baseWhere = whereClause;
  let baseParams = queryParams;

  const {
    charts: chartsQuery,
    meta: metaQuery,
    stats: statsQuery,
  } = buildDashboardQuerySQL(baseWhere, "repatriated");

  const [
    genderChartRes,
    natChartRes,
    creatorChartRes,
    provinceChartRes,
    regionChartRes,
    ageChartRes,
    victimChartRes,
    dateTrendRes,
  ] = await Promise.all([
    pool.query(chartsQuery.genderChartQuery, baseParams),
    pool.query(chartsQuery.natChartQuery, baseParams),
    pool.query(chartsQuery.creatorChartQuery, baseParams),
    pool.query(chartsQuery.provinceChartQuery, baseParams),
    pool.query(chartsQuery.regionChartQuery, baseParams),
    pool.query(chartsQuery.ageChartQuery, baseParams),
    pool.query(chartsQuery.victimChartQuery, baseParams),
    pool.query(chartsQuery.dateTrendQuery, baseParams),
  ]);

  const charts: DashboardStatsCharts<"repatriated"> = {
    gender: genderChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    nationality: natChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    creator: creatorChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
      color: r.color,
    })),
    province: provinceChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    region: regionChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    ageGroup: ageChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    victim: victimChartRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
    dateTrend: dateTrendRes.rows.map((r) => ({
      name: r.name,
      value: parseInt(r.value),
    })),
  };

  const [victimRes] = await Promise.all([
    pool.query(statsQuery.victimCountQuery, baseParams),
  ]);

  const stats: DashboardStatsStats<"repatriated"> = {
    total: totalItems,
    victims: parseInt(victimRes.rows[0].count),
  };

  const [
    allNatsRes,
    allGendersRes,
    allCreatorsRes,
    allProvincesRes,
    allRegionsRes,
  ] = await Promise.all([
    pool.query(metaQuery.allNatsResQuery),
    pool.query(metaQuery.allGendersResQuery),
    pool.query(metaQuery.allCreatorsResQuery),
    pool.query(metaQuery.allProvincesResQuery),
    pool.query(metaQuery.allRegionsResQuery),
  ]);

  const meta: DashboardStatsMeta = {
    totalItems,
    totalPages: Math.ceil(totalItems / limitNum) || 1,
    currentPage: pageNum,
    allNationalities: ["ทั้งหมด", ...allNatsRes.rows.map((r) => r.nat)],
    allProvinces: ["ทั้งหมด", ...allProvincesRes.rows.map((r) => r.prov)],
    allRegions: ["ทั้งหมด", ...allRegionsRes.rows.map((r) => r.reg)],
    allGenders: ["ทั้งหมด", ...allGendersRes.rows.map((r) => r.gen)],
    allCreators: ["ทั้งหมด", ...allCreatorsRes.rows.map((r) => r.creator)],
  };

  return {
    success: true,
    tableData: tableData.rows,
    meta,
    stats,
    charts,
  };
}
