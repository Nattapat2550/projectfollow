import type { GetDashboardDataResponse } from "@/schema/all";
import type { GetDashboardDataRequestQuery } from "@/schema/all";
import type { GetAllDataResponse } from "@/schema/all";
import type { GetAllDataRequestQuery } from "@/schema/all";

import pool from "@/db";

import * as dashboardService from "../services/dashboard";
import * as cache from "../utils/cache";

export async function getAllDataController(
	req: Partial<GetAllDataRequestQuery>
): Promise<GetAllDataResponse> {
	const page = parseInt(req.page || "1");
	const limit = parseInt(req.limit || "100");
	const offset = (page - 1) * limit;

	const cacheKey = `getAllData_page_${page}_limit_${limit}`;
	const cachedData = cache.get(cacheKey);
	if (cachedData) return cachedData;

	// ทำการ LEFT JOIN กับตาราง users เพื่อเอาชื่อคนอัพโหลด (creator_name) และสี (creator_color) ออกมาแสดงในตารางข้อมูลทั้งหมดด้วย
	const [
		immigrantsRes,
		immigrantsCountRes,
		repatriatedsRes,
		repatriatedsCountRes,
	] = await Promise.all([
		pool.query(
			`
        SELECT t.*, u.name AS creator_name, u.color AS creator_color 
        FROM illegal_immigrants t 
        LEFT JOIN users u ON t.created_by = u.id 
        ORDER BY t.detected_date DESC NULLS LAST 
        LIMIT $1 OFFSET $2
      `,
			[limit, offset]
		),
		pool.query("SELECT COUNT(*) FROM illegal_immigrants"),
		pool.query(
			`
        SELECT t.*, u.name AS creator_name, u.color AS creator_color 
        FROM repatriated_persons t 
        LEFT JOIN users u ON t.created_by = u.id 
        ORDER BY t.return_date DESC NULLS LAST 
        LIMIT $1 OFFSET $2
      `,
			[limit, offset]
		),
		pool.query("SELECT COUNT(*) FROM repatriated_persons"),
	]);

	const responsePayload: GetAllDataResponse = {
		success: true,
		data: {
			// ใช้คีย์ immigrants ตามที่กำหนด (และใส่คีย์เดิมสำรองไว้เพื่อความปลอดภัยของระบบ)
			immigrants: immigrantsRes.rows,
			illegals: immigrantsRes.rows,
			repatriateds: repatriatedsRes.rows,
			meta: {
				immigrantsTotal: parseInt(immigrantsCountRes.rows[0].count),
				illegalsTotal: parseInt(immigrantsCountRes.rows[0].count),
				repatriatedsTotal: parseInt(repatriatedsCountRes.rows[0].count),
				currentPage: page,
				limit: limit,
			},
		},
	};

	cache.set(cacheKey, responsePayload);
	return responsePayload;
}

export async function getDashboardDataController(
	req: Partial<GetDashboardDataRequestQuery>
) {
	// รองรับการส่งไทป์มาเป็น 'immigrants' หรือ 'illegal'
	let type = req.type || "repatriated";
	if (type === "immigrants" || type === "immigrant" || type === "illegal") {
		type = "illegal"; // แมปภายในเข้ากับเงื่อนไขของ service และฐานข้อมูลตัวเดิม
	}

	const page = parseInt(req.page || "1");
	const limit = parseInt(req.limit || "50");
	const offset = (page - 1) * limit;

	const cacheKey = `getDashboardData_type_${type}_page_${page}_limit_${limit}_${JSON.stringify(req)}`;
	const cachedData = cache.get(cacheKey);
	if (cachedData) return cachedData;

	// 🟢 สร้าง SQL Query จาก Service
	const { whereClause, params, orderClause } =
		dashboardService.buildDashboardQuerySQL(req, type);
	const tableName =
		type === "repatriated" ? "repatriated_persons" : "illegal_immigrants";
	const paramCount = params.length;

	// ปรับ Query หลักให้ทำการ LEFT JOIN ดึงข้อมูลรายละเอียดบัญชีผู้ใช้ (ชื่อและสี) ของผู้อัพโหลดข้อมูลรายการนั้นๆ
	const dataQuery = `
      SELECT t.*, u.name AS creator_name, u.color AS creator_color 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id 
      ${whereClause} ${orderClause} 
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

	const countQuery = `
      SELECT COUNT(t.id) 
      FROM ${tableName} t 
      LEFT JOIN users u ON t.created_by = u.id
      ${whereClause}
    `;

	const [dataRes, countRes] = await Promise.all([
		pool.query(dataQuery, [...params, limit, offset]),
		pool.query(countQuery, params),
	]);

	const totalItems = parseInt(countRes.rows[0].count);

	const responsePayload: GetDashboardDataResponse = {
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
