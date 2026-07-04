import type { RequestHandler } from "express";

import ExcelJS from "exceljs";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import xlsx from "xlsx";

import pool from "@/db";

import { uploadToDrive } from "../services/googleDrive";
import * as cache from "../utils/cache";

let thaiAddresses = [];
try {
	let addressPath = "./data/thai_addresses.json";
	if (!fs.existsSync(addressPath)) {
		if (fs.existsSync("./backend/data/thai_addresses.json")) {
			addressPath = "./backend/data/thai_addresses.json";
		}
	}
	thaiAddresses = JSON.parse(fs.readFileSync(addressPath, "utf-8"));
} catch (err) {
	console.error("Could not load thai_addresses.json for address parsing", err);
}

// Helper functions
const removePrefix = (fullName) => {
	if (!fullName || typeof fullName !== "string") return fullName;
	const prefixRegex =
		/^(พล\.ต\.อ\.|พล\.ต\.ท\.|พล\.ต\.ต\.|พ\.ต\.อ\.|พ\.ต\.ท\.|พ\.ต\.ต\.|ร\.ต\.อ\.|ร\.ต\.ท\.|ร\.ต\.ต\.|ด\.ต\.|จ\.ส\.ต\.|ส\.ต\.อ\.|ส\.ต\.ท\.|ส\.ต\.ต\.|ว่าที่ ร\.ต\.|นางสาว|น\.ส\.|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นาง|Mr\.|Mrs\.|Ms\.|Miss\s*)/i;
	return fullName.replace(prefixRegex, "").trim();
};

const splitName = (fullName) => {
	if (!fullName || typeof fullName !== "string")
		return { first: null, middle: null, last: null };
	const nameWithoutPrefix = removePrefix(fullName);
	const parts = nameWithoutPrefix.split(/\s+/);

	if (parts.length === 1) return { first: parts[0], middle: null, last: null };
	if (parts.length === 2)
		return { first: parts[0], middle: null, last: parts[1] };
	if (parts.length >= 3) {
		const first = parts[0];
		const last = parts[parts.length - 1];
		const middle = parts.slice(1, parts.length - 1).join(" ");
		return { first, middle, last };
	}
	return { first: null, middle: null, last: null };
};

const determineGenderFromName = (fullName) => {
	if (!fullName || typeof fullName !== "string") return null;
	const prefixRegex =
		/^(นาย|นางสาว|น\.ส\.|นาง|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|Mr\.|Mrs\.|Ms\.|Miss)/i;
	const match = fullName.match(prefixRegex);
	if (match) {
		const prefix = match[1].toLowerCase().replace(/\s+/g, "");
		if (["mr.", "ด.ช.", "เด็กชาย", "นาย"].includes(prefix)) return "ชาย";
		if (
			[
				"miss",
				"mrs.",
				"ms.",
				"ด.ญ.",
				"เด็กหญิง",
				"น.ส.",
				"นาง",
				"นางสาว",
			].includes(prefix)
		)
			return "หญิง";
	}
	return null;
};

const parseThaiDOBToDate = (dobStr) => {
	if (dobStr == null || dobStr === "") return null;
	if (typeof dobStr === "number")
		return new Date(Math.round((dobStr - 25569) * 86400 * 1000));
	const str = String(dobStr).trim();
	if (str === "ไม่ระบุ" || str === "-") return null;
	const parts = str.split("/");
	if (parts.length === 3) {
		const day = parseInt(parts[0], 10);
		const month = parseInt(parts[1], 10);
		let year = parseInt(parts[2], 10);
		if (year > 2400) year -= 543;
		if (!isNaN(day) && !isNaN(month) && !isNaN(year))
			return new Date(Date.UTC(year, month - 1, day));
	}
	const d = new Date(str);
	return isNaN(d.getTime()) ? null : d;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uploadWithRetry = async (fileObj, folderId, maxRetries = 5) => {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await uploadToDrive(fileObj, folderId);
		} catch (error) {
			console.error(
				`[Drive Upload Attempt ${attempt}/${maxRetries} Failed]:`,
				error.message
			);
			if (attempt === maxRetries) {
				throw new Error(
					`อัปโหลดล้มเหลวหลังจากพยายาม ${maxRetries} ครั้ง (${error.message})`
				);
			}
			await delay(attempt * 2000);
		}
	}
};

const limitConcurrency = async (tasks, limit) => {
	const results = [];
	const executing = new Set();
	for (const task of tasks) {
		const p = Promise.resolve().then(() => task());
		results.push(p);
		executing.add(p);
		const clean = () => executing.delete(p);
		p.then(clean, clean);
		if (executing.size >= limit) {
			await Promise.race(executing);
		}
	}
	return Promise.all(results);
};

const splitThaiAddress = (fullAddress) => {
	if (!fullAddress || typeof fullAddress !== "string") {
		return {
			details: "ไม่ระบุ",
			sub_district: null,
			district: null,
			province: null,
		};
	}

	let str = fullAddress.trim();
	let province = null,
		district = null,
		sub_district = null;

	const provMatch =
		str.match(/(?:จ\.| จว\.|จังหวัด)\s*([^\s]+)/)
		|| str.match(
			/\s(กรุงเทพมหานคร|กรุงเทพฯ|กทม\.?|เชียงใหม่|ภูเก็ต|โคราช|ชลบุรี)$/
		);
	if (provMatch) {
		province = provMatch[1];
		str = str.replace(provMatch[0], "").trim();
	}

	const distMatch = str.match(/(?:อ\.|อำเภอ|เขต)\s*([^\s]+)/);
	if (distMatch) {
		district = distMatch[1];
		str = str.replace(distMatch[0], "").trim();
	}

	const subMatch = str.match(/(?:ต\.|ตำบล|แขวง)\s*([^\s]+)/);
	if (subMatch) {
		sub_district = subMatch[1];
		str = str.replace(subMatch[0], "").trim();
	}
	// Clean/Normalize matched province, district, sub_district
	if (province) {
		const p = province.replace(/^(จังหวัด|จ\.|จว\.)/, "").trim();
		if (["กทม", "กทม.", "กรุงเทพ", "กรุงเทพมหานคร", "กรุงเทพฯ"].includes(p)) {
			province = "กรุงเทพมหานคร";
		} else if (p === "โคราช") {
			province = "นครราชสีมา";
		} else {
			const found = thaiAddresses.find(
				(addr) => addr.province.includes(p) || p.includes(addr.province)
			);
			if (found) province = found.province;
			else province = p;
		}
	}

	if (district) {
		const d = district.replace(/^(อำเภอ|เขต|อ\.)/, "").trim();
		if (province && thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) =>
					addr.province === province
					&& (addr.amphoe.includes(d) || d.includes(addr.amphoe))
			);
			if (found) district = found.amphoe;
			else district = d;
		} else if (thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) => addr.amphoe.includes(d) || d.includes(addr.amphoe)
			);
			if (found) district = found.amphoe;
			else district = d;
		} else {
			district = d;
		}
	}

	if (sub_district) {
		const s = sub_district.replace(/^(ตำบล|แขวง|ต\.)/, "").trim();
		if (province && district && thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) =>
					addr.province === province
					&& addr.amphoe === district
					&& (addr.district.includes(s) || s.includes(addr.district))
			);
			if (found) sub_district = found.district;
			else sub_district = s;
		} else if (province && thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) =>
					addr.province === province
					&& (addr.district.includes(s) || s.includes(addr.district))
			);
			if (found) sub_district = found.district;
			else sub_district = s;
		} else if (thaiAddresses.length > 0) {
			const found = thaiAddresses.find(
				(addr) => addr.district.includes(s) || s.includes(addr.district)
			);
			if (found) sub_district = found.district;
			else sub_district = s;
		} else {
			sub_district = s;
		}
	}

	// Smart autofill using thai_addresses.json
	if (sub_district && (!district || !province) && thaiAddresses.length > 0) {
		// Find all matches for this sub_district
		const matches = thaiAddresses.filter(
			(addr) => addr.district === sub_district
		);

		if (matches.length > 0) {
			// Check if it's unique across the country (i.e., all matches have the same district/province)
			const uniqueDistricts = new Set(matches.map((m) => m.amphoe));
			const uniqueProvinces = new Set(matches.map((m) => m.province));

			if (uniqueDistricts.size === 1 && uniqueProvinces.size === 1) {
				if (!district) district = matches[0].amphoe;
				if (!province) province = matches[0].province;
			}
		}
	} else if (district && !province && thaiAddresses.length > 0) {
		const matches = thaiAddresses.filter((addr) => addr.amphoe === district);
		if (matches.length > 0) {
			const uniqueProvinces = new Set(matches.map((m) => m.province));
			if (uniqueProvinces.size === 1) {
				province = matches[0].province;
			}
		}
	}

	return {
		details: str || "ไม่ระบุ",
		sub_district,
		district,
		province,
	};
};

if (!global.uploadProgress) {
	global.uploadProgress = {};
}

export const getUploadProgress: RequestHandler = (req, res) => {
	const jobId = req.params.jobId;
	res.json(
		global.uploadProgress[jobId] || {
			current: 0,
			total: 0,
			status: "pending",
		}
	);
};

export const uploadExcel: RequestHandler = async (req, res) => {
	try {
		if (!req.file || !req.file.buffer)
			return res
				.status(400)
				.json({ success: false, message: "กรุณาแนบไฟล์ Excel" });

		const action = req.query.action || "upload";
		const jobId = req.query.jobId;

		// อ่านไฟล์ Excel จาก Buffer ในหน่วยความจำโดยตรง
		const workbookXlsx = xlsx.read(req.file.buffer, { type: "buffer" });
		const sheetName = workbookXlsx.SheetNames[0];
		let rawData = xlsx.utils.sheet_to_json(workbookXlsx.Sheets[sheetName], {
			defval: null,
		});

		rawData = rawData.filter((row) => {
			const thName = row["ชื่อ สกุล (ไทย)"];
			const enName = row["ชื่อ สกุล (อังกฤษ)"];
			const idCard = row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"];
			const pass = row["เลขพาสปอร์ต"];
			return (
				(thName && String(thName).trim() !== "")
				|| (enName && String(enName).trim() !== "")
				|| idCard
				|| pass
			);
		});

		// ใช้ exceljs อ่านภาพจาก Buffer เช่นกัน
		const workbookExt = new ExcelJS.Workbook();
		await workbookExt.xlsx.load(req.file.buffer);
		const worksheetExt = workbookExt.worksheets[0];

		const imagesMap = {};
		for (const image of worksheetExt.getImages()) {
			const rowIdx = image.range.tl.nativeRow;
			const imgInfo = workbookExt.getImage(image.imageId);
			if (imgInfo && imgInfo.buffer) {
				imagesMap[rowIdx] = {
					buffer: imgInfo.buffer,
					extension: imgInfo.extension || "jpeg",
				};
			}
		}

		// ================= โหมดพรีวิว =================
		if (action === "preview") {
			const preview_data = [];
			for (let i = 0; i < rawData.length; i++) {
				const row = rawData[i];
				const rawThName = row["ชื่อ สกุล (ไทย)"];
				const rawEnName = row["ชื่อ สกุล (อังกฤษ)"];
				const thName = splitName(rawThName);
				const enName = splitName(rawEnName);
				const autoGender =
					determineGenderFromName(rawThName)
					|| determineGenderFromName(rawEnName)
					|| (row["เพศ"] ? String(row["เพศ"]).trim() : null);

				const raw_id = row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"];
				const id_card =
					raw_id ? String(raw_id).replace(/[^0-9a-zA-Z]/g, "") : `NO_ID_${i}`;
				const dobDate = parseThaiDOBToDate(row["วัน/เดือน/ปี เกิด"]);

				let photo_url_preview = null;
				if (imagesMap[i + 1]) {
					const base64Data = imagesMap[i + 1].buffer.toString("base64");
					const mimeType =
						imagesMap[i + 1].extension === "png" ? "image/png" : "image/jpeg";
					photo_url_preview = `data:${mimeType};base64,${base64Data}`;
				} else if (row["รูปจาก ทร.14"]) {
					photo_url_preview = String(row["รูปจาก ทร.14"]);
				}

				const locationRaw = row["ที่อยู่"] ? String(row["ที่อยู่"]) : "";
				const parsedLocation = splitThaiAddress(locationRaw);

				preview_data.push({
					ลำดับที่อ่านได้: i + 1,
					first_name_th: thName.first || "ไม่ระบุ",
					last_name_th: thName.last || "ไม่ระบุ",
					first_name_en: enName.first || null,
					last_name_en: enName.last || null,
					dob: dobDate ? dobDate.toISOString().split("T")[0] : "ไม่ระบุ",
					gender: autoGender,
					nationality: "ไทย",
					id_card: id_card,
					passport:
						row["เลขพาสปอร์ต"] ? String(row["เลขพาสปอร์ต"]).trim() : null,
					photo_url: photo_url_preview,
					address_details: parsedLocation.details,
					sub_district: parsedLocation.sub_district,
					district: parsedLocation.district,
					province: parsedLocation.province,
					building: row["ตึก ที่ทำงาน"] ? String(row["ตึก ที่ทำงาน"]) : null,
					floor: row["ชั้น ที่ทำงาน"] ? String(row["ชั้น ที่ทำงาน"]) : null,
					room: row["ห้อง ที่ทำงาน"] ? String(row["ห้อง ที่ทำงาน"]) : null,
					job_type: row["ประเภทงาน"] ? String(row["ประเภทงาน"]) : null,
					role: row["ทำหน้าที่"] ? String(row["ทำหน้าที่"]) : null,
					salary:
						row["เงินเดือนที่ได้รับ(บาท)"] ?
							String(row["เงินเดือนที่ได้รับ(บาท)"])
						:	null,
					paid_by:
						row["รับเงินเดือนจากใคร"] ?
							String(row["รับเงินเดือนจากใคร"])
						:	null,
					payment_method:
						row["ช่องทางการรับเงินเดือน"] ?
							String(row["ช่องทางการรับเงินเดือน"])
						:	null,
					case_id_count: parseInt(row["จำนวน Case ID"]) || 0,
					warrant: parseInt(row["หมายจับ"]) || 0,
					is_victim: (() => {
						const vi =
							row["มีข้อบ่งชี้ / ไม่มีข้อบ่งชี้ (เหยื่อ)"] ?
								String(row["มีข้อบ่งชี้ / ไม่มีข้อบ่งชี้ (เหยื่อ)"]).trim()
							:	"";
						if (vi.includes("ไม่มี")) return "NO";
						if (vi.includes("มี")) return "YES";
						return "PENDING";
					})(),
					responsible_agency:
						row["หน่วยงานที่รับผิดชอบ"] ?
							String(row["หน่วยงานที่รับผิดชอบ"])
						:	null,
					note: row["หมายเหตุ"] ? String(row["หมายเหตุ"]) : null,
					raw_data_from_excel: row,
				});
			}
			return res.status(200).json({
				success: true,
				message: "ดึงข้อมูลพรีวิวสำเร็จ",
				total_rows: preview_data.length,
				preview_data,
			});
		}

		// ================= โหมดอัปโหลด =================
		let successCount = 0;
		const errors = [];
		if (jobId)
			global.uploadProgress[jobId] = {
				current: 0,
				total: rawData.length,
				status: "processing",
			};

		const created_by = req.user ? req.user.id : null;

		// 1. Gather all id_cards and passports to query db in ONE go
		const nationalIds = [];
		const passportIds = [];
		for (let i = 0; i < rawData.length; i++) {
			const row = rawData[i];
			const raw_id = row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"];
			const id_card =
				raw_id ? String(raw_id).replace(/[^0-9a-zA-Z]/g, "") : null;

			let passport =
				row["เลขพาสปอร์ต"] ?
					String(row["เลขพาสปอร์ต"]).replace(/\s/g, "").trim()
				:	null;
			if (
				passport
				&& [
					"-",
					"n/a",
					"none",
					"null",
					"ไม่มี",
					"ไม่มีหนังสือเดินทาง",
					"ไม่ระบุ",
				].includes(passport.toLowerCase())
			)
				passport = null;

			if (id_card) nationalIds.push(id_card);
			if (passport) passportIds.push(passport);
		}

		// 2. Fetch existing records matching national_id OR passport_id
		const existingMap = new Map(); // Key: 'nat_ID' or 'pass_ID', Value: uuid
		if (nationalIds.length > 0 || passportIds.length > 0) {
			try {
				const existingRes = await pool.query(
					`SELECT id, national_id, passport_id 
                     FROM repatriated_persons 
                     WHERE (national_id = ANY($1::varchar[])) OR (passport_id = ANY($2::varchar[]))`,
					[nationalIds, passportIds]
				);
				for (const row of existingRes.rows) {
					if (row.national_id)
						existingMap.set("nat_" + row.national_id, row.id);
					if (row.passport_id)
						existingMap.set("pass_" + row.passport_id, row.id);
				}
			} catch (queryErr) {
				console.error("Error fetching existing records in batch:", queryErr);
			}
		}

		// 3. Create tasks to process rows concurrently (Google Drive uploads first)
		let currentProgress = 0;
		const processedRows = [];

		const driveTasks = rawData.map((row, i) => {
			return async () => {
				try {
					const rawThName = row["ชื่อ สกุล (ไทย)"];
					const rawEnName = row["ชื่อ สกุล (อังกฤษ)"];
					const thName = splitName(rawThName);
					const enName = splitName(rawEnName);
					const autoGender =
						determineGenderFromName(rawThName)
						|| determineGenderFromName(rawEnName)
						|| (row["เพศ"] ? String(row["เพศ"]).trim() : null);

					let drivePhotoUrl = null;

					if (imagesMap[i + 1]) {
						try {
							const tempFileName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}.${imagesMap[i + 1].extension}`;

							const driveResult = await uploadWithRetry(
								{
									originalname: tempFileName,
									mimetype: `image/${imagesMap[i + 1].extension}`,
									buffer: imagesMap[i + 1].buffer,
								},
								process.env.GOOGLE_DRIVE_FOLDER_ID
							);

							if (driveResult && driveResult.webViewLink) {
								drivePhotoUrl = driveResult.webViewLink;
							}
						} catch (e) {
							console.error("Drive Upload Final Error:", e);
							errors.push(
								`แถวที่ ${i + 1}: อัปโหลดรูปภาพไม่สำเร็จ (${e.message})`
							);
						}
					} else if (row["รูปจาก ทร.14"]) {
						drivePhotoUrl = String(row["รูปจาก ทร.14"]);
					}

					const raw_id = row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"];
					const id_card =
						raw_id ?
							String(raw_id).replace(/[^0-9a-zA-Z]/g, "")
						:	`NO_ID_${Date.now()}_${i}`;

					let passport =
						row["เลขพาสปอร์ต"] ?
							String(row["เลขพาสปอร์ต"]).replace(/\s/g, "").trim()
						:	null;
					if (
						passport
						&& [
							"-",
							"n/a",
							"none",
							"null",
							"ไม่มี",
							"ไม่มีหนังสือเดินทาง",
							"ไม่ระบุ",
						].includes(passport.toLowerCase())
					)
						passport = null;

					const dobDate = parseThaiDOBToDate(row["วัน/เดือน/ปี เกิด"]);
					const caseCount = parseInt(row["จำนวน Case ID"]);
					const warrantCount = parseInt(row["หมายจับ"]);

					const locationRaw = row["ที่อยู่"] ? String(row["ที่อยู่"]) : "";
					const parsedLocation = splitThaiAddress(locationRaw);

					processedRows[i] = {
						index: i,
						thName,
						enName,
						autoGender,
						drivePhotoUrl,
						id_card,
						passport,
						dobDate,
						caseCount,
						warrantCount,
						parsedLocation,
						row,
					};
				} catch (err) {
					errors.push(
						`แถวที่ ${i + 1}: เกิดข้อผิดพลาดในการประมวลผลข้อมูล (${err.message})`
					);
				}

				currentProgress++;
				if (jobId && global.uploadProgress[jobId]) {
					// Google Drive uploads represent first 50% of the progress
					global.uploadProgress[jobId].current = Math.round(
						(currentProgress / rawData.length) * (rawData.length * 0.5)
					);
				}
			};
		});

		// Run Google Drive uploads concurrently with a limit of 20
		await limitConcurrency(driveTasks, 20);

		// 4. Partition into updates (concurrently) and inserts (batch insert)
		const insertRows = [];
		const updateTasks = [];

		for (let i = 0; i < processedRows.length; i++) {
			const pRow = processedRows[i];
			if (!pRow) continue;

			let existingId = null;
			if (!pRow.id_card.startsWith("NO_ID_")) {
				existingId = existingMap.get("nat_" + pRow.id_card);
			}
			if (!existingId && pRow.passport) {
				existingId = existingMap.get("pass_" + pRow.passport);
			}

			let is_victim_val = "PENDING";
			const vi =
				pRow.row["มีข้อบ่งชี้ / ไม่มีข้อบ่งชี้ (เหยื่อ)"] ?
					String(pRow.row["มีข้อบ่งชี้ / ไม่มีข้อบ่งชี้ (เหยื่อ)"]).trim()
				:	"";
			if (vi.includes("ไม่มี")) {
				is_victim_val = "NO";
			} else if (vi.includes("มี")) {
				is_victim_val = "YES";
			}

			const values = [
				pRow.thName.first || "ไม่ระบุ",
				pRow.thName.middle || null,
				pRow.thName.last || "ไม่ระบุ",
				pRow.enName.first || null,
				pRow.enName.middle || null,
				pRow.enName.last || null,
				pRow.dobDate,
				pRow.autoGender,
				pRow.id_card,
				pRow.passport,
				pRow.parsedLocation.details,
				pRow.parsedLocation.sub_district,
				pRow.parsedLocation.district,
				pRow.parsedLocation.province,
				pRow.row["ตึก ที่ทำงาน"] ? String(pRow.row["ตึก ที่ทำงาน"]) : null,
				pRow.row["ชั้น ที่ทำงาน"] ? String(pRow.row["ชั้น ที่ทำงาน"]) : null,
				pRow.row["ห้อง ที่ทำงาน"] ? String(pRow.row["ห้อง ที่ทำงาน"]) : null,
				pRow.row["ประเภทงาน"] ? String(pRow.row["ประเภทงาน"]) : null,
				pRow.row["ทำหน้าที่"] ? String(pRow.row["ทำหน้าที่"]) : null,
				pRow.row["เงินเดือนที่ได้รับ(บาท)"] ?
					String(pRow.row["เงินเดือนที่ได้รับ(บาท)"])
				:	null,
				pRow.row["รับเงินเดือนจากใคร"] ?
					String(pRow.row["รับเงินเดือนจากใคร"])
				:	null,
				pRow.row["ช่องทางการรับเงินเดือน"] ?
					String(pRow.row["ช่องทางการรับเงินเดือน"])
				:	null,
				isNaN(pRow.caseCount) ? 0 : pRow.caseCount,
				isNaN(pRow.warrantCount) ? 0 : pRow.warrantCount,
				is_victim_val,
				pRow.row["หน่วยงานที่รับผิดชอบ"] ?
					String(pRow.row["หน่วยงานที่รับผิดชอบ"])
				:	null,
				pRow.row["หมายเหตุ"] ? String(pRow.row["หมายเหตุ"]) : null,
				"ไทย",
			];

			if (existingId) {
				updateTasks.push(async () => {
					try {
						let updateQ = `UPDATE repatriated_persons SET 
                            first_name_th=$1, middle_name_th=$2, last_name_th=$3, first_name_en=$4, middle_name_en=$5, last_name_en=$6,
                            date_of_birth=$7, gender=$8, national_id=$9, passport_id=$10, address_details=$11, sub_district=$12, district=$13, province=$14,
                            building=$15, floor=$16, room=$17, job_type=$18, role=$19, salary=$20, paid_by=$21, payment_method=$22,
                            number_of_case=$23, number_of_warrant=$24, is_victim=$25, responsible_agency=$26, note=$27, nationality=$28, updated_at=NOW()`;

						const updateVals = [...values];
						if (pRow.drivePhotoUrl) {
							updateQ += `, photo_url=$29 WHERE id=$30`;
							updateVals.push(pRow.drivePhotoUrl, existingId);
						} else {
							updateQ += ` WHERE id=$29`;
							updateVals.push(existingId);
						}
						await pool.query(updateQ, updateVals);
						successCount++;
					} catch (dbErr) {
						errors.push(`แถวที่ ${pRow.index + 1}: ${dbErr.message}`);
					}
					currentProgress++;
					if (jobId && global.uploadProgress[jobId]) {
						global.uploadProgress[jobId].current = Math.round(
							(currentProgress / (rawData.length * 2)) * rawData.length
						);
					}
				});
			} else {
				insertRows.push({
					values: [uuidv4(), ...values, pRow.drivePhotoUrl || null, created_by],
					index: pRow.index,
				});
			}
		}

		// 5. Execute batch inserts
		if (insertRows.length > 0) {
			const fields = [
				"id",
				"first_name_th",
				"middle_name_th",
				"last_name_th",
				"first_name_en",
				"middle_name_en",
				"last_name_en",
				"date_of_birth",
				"gender",
				"national_id",
				"passport_id",
				"address_details",
				"sub_district",
				"district",
				"province",
				"building",
				"floor",
				"room",
				"job_type",
				"role",
				"salary",
				"paid_by",
				"payment_method",
				"number_of_case",
				"number_of_warrant",
				"is_victim",
				"responsible_agency",
				"note",
				"nationality",
				"photo_url",
				"created_by",
			];

			const chunkSize = Math.floor(60000 / fields.length);
			for (let c = 0; c < insertRows.length; c += chunkSize) {
				const chunk = insertRows.slice(c, c + chunkSize);
				const values = [];
				const valueStrings = [];

				for (let i = 0; i < chunk.length; i++) {
					const rowValues = chunk[i].values;
					const placeholders = fields
						.map((_, fIdx) => `$${values.length + fIdx + 1}`)
						.join(", ");
					valueStrings.push(`(${placeholders})`);
					values.push(...rowValues);
				}

				try {
					const insertQ = `INSERT INTO repatriated_persons (${fields.join(", ")}) VALUES ${valueStrings.join(", ")}`;
					await pool.query(insertQ, values);
					successCount += chunk.length;
				} catch (dbErr) {
					console.error(
						"Batch insert failed, falling back to sequential:",
						dbErr.message
					);
					for (const item of chunk) {
						try {
							const singleInsertQ = `INSERT INTO repatriated_persons (${fields.join(", ")}) VALUES (${fields.map((_, fIdx) => `$${fIdx + 1}`).join(", ")})`;
							await pool.query(singleInsertQ, item.values);
							successCount++;
						} catch (singleErr) {
							errors.push(`แถวที่ ${item.index + 1}: ${singleErr.message}`);
						}
					}
				}
				currentProgress += chunk.length;
				if (jobId && global.uploadProgress[jobId]) {
					global.uploadProgress[jobId].current = Math.round(
						(currentProgress / (rawData.length * 2)) * rawData.length
					);
				}
			}
		}

		// 6. Execute updates concurrently (limit = 20)
		if (updateTasks.length > 0) {
			await limitConcurrency(updateTasks, 20);
		}

		// 7. Clear read Cache on successful database operations
		if (successCount > 0) {
			cache.clear();
		}

		if (jobId && global.uploadProgress[jobId])
			global.uploadProgress[jobId].status = "completed";

		if (successCount === 0 && rawData.length > 0) {
			return res.status(400).json({
				success: false,
				message: `ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้: ${errors[0] || "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล"}`,
			});
		}

		res.status(200).json({
			success: true,
			message: `อัปโหลดและบันทึกข้อมูลสำเร็จ ${successCount} จาก ${rawData.length} รายการ`,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "เกิดข้อผิดพลาด: " + error.message,
		});
	}
};
