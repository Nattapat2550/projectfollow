const xlsx = require("xlsx");
const fs = require("fs");

// ฟังก์ชันลบคำนำหน้าชื่อ (เพิ่มคำที่ต้องการในวงเล็บได้เลย โดยต้องเอาคำที่ "ยาวกว่า" ขึ้นก่อนเสมอ เช่น เอา นางสาว ไว้หน้า นาง)
const removePrefix = (fullName) => {
	if (!fullName || typeof fullName !== "string") return fullName;
	
	const prefixRegex = /^(พล\.ต\.อ\.|พล\.ต\.ท\.|พล\.ต\.ต\.|พ\.ต\.อ\.|พ\.ต\.ท\.|พ\.ต\.ต\.|ร\.ต\.อ\.|ร\.ต\.ท\.|ร\.ต\.ต\.|ด\.ต\.|จ\.ส\.ต\.|ส\.ต\.อ\.|ส\.ต\.ท\.|ส\.ต\.ต\.|ว่าที่ ร\.ต\.|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นาง|Mr\.|Mrs\.|Ms\.|Miss\s*)/i;
	
	// ลบคำนำหน้าออกและตัดช่องว่างหัวท้ายทิ้ง
	return fullName.replace(prefixRegex, '').trim();
};

// ฟังก์ชันสำหรับแยก ชื่อแรก ชื่อกลาง นามสกุล จากข้อความก้อนเดียว
const splitName = (fullName) => {
	if (!fullName || typeof fullName !== "string") {
		return { first: null, middle: null, last: null };
	}
	
	// 1. นำข้อความไปตัดคำนำหน้าชื่อออกก่อน
	const nameWithoutPrefix = removePrefix(fullName);
	
	// 2. แยกคำด้วยช่องว่าง (สเปซบาร์)
	const parts = nameWithoutPrefix.split(/\s+/);
	
	if (parts.length === 1) {
		// มีแค่ชื่อ
		return { first: parts[0], middle: null, last: null };
	} else if (parts.length === 2) {
		// มีแค่ชื่อ กับ นามสกุล
		return { first: parts[0], middle: null, last: parts[1] };
	} else if (parts.length >= 3) {
		// มีชื่อ ชื่อกลาง นามสกุล
		const first = parts[0];
		const last = parts[parts.length - 1]; // เอาคำสุดท้ายเป็นนามสกุล
		const middle = parts.slice(1, parts.length - 1).join(" "); // ที่เหลือตรงกลางคือชื่อกลาง
		return { first, middle, last };
	}
	
	return { first: null, middle: null, last: null };
};

exports.uploadExcel = (req, res) => {
	try {
		// เช็คว่ามีไฟล์ส่งมาหรือไม่
		if (!req.file) {
			return res.status(400).json({ success: false, message: "กรุณาแนบไฟล์ Excel" });
		}

		// อ่านไฟล์ Excel
		const workbook = xlsx.readFile(req.file.path);
		const sheetName = workbook.SheetNames[0]; // อ่านจาก Sheet แรก
		const sheet = workbook.Sheets[sheetName];
		const rawData = xlsx.utils.sheet_to_json(sheet);

		// Map ข้อมูล Excel เข้ากับโครงสร้างจำลอง DB
		const preview_data = rawData.map((row, index) => {
			
			// เรียกใช้ฟังก์ชันแยกชื่อ-นามสกุล (ซึ่งมันจะไปตัดคำนำหน้าให้อัตโนมัติด้วย)
			const thName = splitName(row["ชื่อ สกุล (ไทย)"]);
			const enName = splitName(row["ชื่อ สกุล (อังกฤษ)"]);

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
				
				// เก็บข้อมูลดิบไว้แสดงฝั่งขวา
				raw_data_from_excel: row
			};
		});

		// ลบไฟล์ชั่วคราวออกเมื่อประมวลผลเสร็จ
		fs.unlinkSync(req.file.path);

		// ส่งข้อมูลกลับไปแสดงพรีวิว
		res.status(200).json({
			success: true,
			message: "อ่านแยกข้อมูล และตัดคำนำหน้าชื่อสำเร็จ",
			total_rows: rawData.length,
			preview_data: preview_data
		});

	} catch (error) {
		// เคลียร์ไฟล์ขยะกรณีเกิด Error
		if (req.file && fs.existsSync(req.file.path)) {
			fs.unlinkSync(req.file.path);
		}
		console.error("Error reading excel:", error);
		res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการประมวลผล Excel: " + error.message });
	}
};