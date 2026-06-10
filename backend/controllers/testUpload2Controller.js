const xlsx = require("xlsx");
const ExcelJS = require("exceljs"); // นำเข้าไลบรารีใหม่สำหรับดึงรูป
const fs = require("fs");

// ฟังก์ชันลบคำนำหน้าชื่อ
const removePrefix = (fullName) => {
	if (!fullName || typeof fullName !== "string") return fullName;
	const prefixRegex = /^(พล\.ต\.อ\.|พล\.ต\.ท\.|พล\.ต\.ต\.|พ\.ต\.อ\.|พ\.ต\.ท\.|พ\.ต\.ต\.|ร\.ต\.อ\.|ร\.ต\.ท\.|ร\.ต\.ต\.|ด\.ต\.|จ\.ส\.ต\.|ส\.ต\.อ\.|ส\.ต\.ท\.|ส\.ต\.ต\.|ว่าที่ ร\.ต\.|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นาง|Mr\.|Mrs\.|Ms\.|Miss\s*)/i;
	return fullName.replace(prefixRegex, '').trim();
};

// ฟังก์ชันสำหรับแยก ชื่อแรก ชื่อกลาง นามสกุล 
const splitName = (fullName) => {
	if (!fullName || typeof fullName !== "string") {
		return { first: null, middle: null, last: null };
	}
	const nameWithoutPrefix = removePrefix(fullName);
	const parts = nameWithoutPrefix.split(/\s+/);
	
	if (parts.length === 1) return { first: parts[0], middle: null, last: null };
	if (parts.length === 2) return { first: parts[0], middle: null, last: parts[1] };
	if (parts.length >= 3) {
		const first = parts[0];
		const last = parts[parts.length - 1]; 
		const middle = parts.slice(1, parts.length - 1).join(" "); 
		return { first, middle, last };
	}
	return { first: null, middle: null, last: null };
};

// เปลี่ยนเป็น async function เพื่อให้ใช้กับ ExcelJS ได้
exports.uploadExcel = async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ success: false, message: "กรุณาแนบไฟล์ Excel" });
		}

		// 1. อ่านข้อมูล Text ด้วย xlsx (เพื่อความง่ายและแม่นยำของ Text)
		const workbookXlsx = xlsx.readFile(req.file.path);
		const sheetName = workbookXlsx.SheetNames[0];
		const rawData = xlsx.utils.sheet_to_json(workbookXlsx.Sheets[sheetName]);

		// 2. ดึงข้อมูลรูปภาพที่ฝังในเซลล์ ด้วย ExcelJS
		const workbookExt = new ExcelJS.Workbook();
		await workbookExt.xlsx.readFile(req.file.path);
		const worksheetExt = workbookExt.worksheets[0];

		const imagesMap = {};
		// วนลูปรูปภาพทั้งหมดที่พบใน Sheet
		for (const image of worksheetExt.getImages()) {
			// image.range.tl.nativeRow คือตำแหน่งแถวใน Excel (0 คือบรรทัดที่ 1/Header, 1 คือบรรทัดที่ 2)
			const rowIdx = image.range.tl.nativeRow; 
			const imgInfo = workbookExt.getImage(image.imageId);
			
			if (imgInfo && imgInfo.buffer) {
				// แปลงรูปภาพเป็น Base64 String เพื่อให้ส่งผ่าน JSON ไปโชว์ Preview ได้ทันที
				const base64Str = `data:image/${imgInfo.extension || 'jpeg'};base64,${imgInfo.buffer.toString("base64")}`;
				imagesMap[rowIdx] = base64Str;
			}
		}

		// 3. Map ข้อมูล Excel เข้ากับโครงสร้างจำลอง DB
		const preview_data = rawData.map((row, index) => {
			
			const thName = splitName(row["ชื่อ สกุล (ไทย)"]);
			const enName = splitName(row["ชื่อ สกุล (อังกฤษ)"]);

			// rawData (ข้อมูลเริ่ม index 0) ตรงกับแถวที่ 2 ใน Excel ซึ่งเท่ากับ nativeRow = 1 ใน ExcelJS
			const excelRowIndex = index + 1; 
			// ดึงรูป Base64 จากแถวที่ตรงกัน (ถ้าไม่มีให้เป็น null)
			const photoBase64 = imagesMap[excelRowIndex] || row["รูปจาก ทร.14"] || null; 

			return {
				ลำดับที่อ่านได้: index + 1,
				
				first_name_th: thName.first,
				middle_name_th: thName.middle,
				last_name_th: thName.last,
				
				first_name_en: enName.first,
				middle_name_en: enName.middle,
				last_name_en: enName.last,
				
				age: row["อายุ(ปี)"] || null,
				id_card: row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"] || null,
				passport: row["เลขพาสปอร์ต"] || null,
				dob: row["วัน/เดือน/ปี เกิด"] || null,
				address: row["ที่อยู่"] || null,
				
				// ช่องรูปภาพ จะได้เป็นก้อน Base64 แทน
				photo_url: photoBase64, 
				
				case_id_count: row["จำนวน Case ID"] || null,
				warrant: row["หมายจับ"] || null,
				building: row["ตึก ที่ทำงาน"] || null,
				floor: row["ชั้น ที่ทำงาน"] || null,
				room: row["ห้อง ที่ทำงาน"] || null,
				job_type: row["ประเภทงาน"] || null,
				role: row["ทำหน้าที่"] || null,
				salary: row["เงินเดือนที่ได้รับ(บาท)"] || null,
				paid_by: row["รับเงินเดือนจากใคร"] || null,
				payment_method: row["ช่องทางการรับเงินเดือน"] || null,
				victim_indicator: row["มีข้อบ่งชี้ / ไม่มีข้อบ่งชี้ (เหยื่อ)"] || null,
				responsible_agency: row["หน่วยงานที่รับผิดชอบ"] || null,
				note: row["หมายเหตุ"] || null,
				
				raw_data_from_excel: row
			};
		});

		fs.unlinkSync(req.file.path);

		res.status(200).json({
			success: true,
			message: "อ่านแยกข้อมูล ดึงรูปภาพ และตัดคำนำหน้าสำเร็จ",
			total_rows: rawData.length,
			preview_data: preview_data
		});

	} catch (error) {
		if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
		console.error("Error reading excel:", error);
		res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการประมวลผล Excel: " + error.message });
	}
};