const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const fs = require("fs");
const supabase = require("../config/supabase"); //

// ฟังก์ชันลบคำนำหน้าชื่อ
const removePrefix = (fullName) => {
	if (!fullName || typeof fullName !== "string") return fullName; //
	const prefixRegex = /^(พล\.ต\.อ\.|พล\.ต\.ท\.|พล\.ต\.ต\.|พ\.ต\.อ\.|พ\.ต\.ท\.|พ\.ต\.ต\.|ร\.ต\.อ\.|ร\.ต\.ท\.|ร\.ต\.ต\.|ด\.ต\.|จ\.ส\.ต\.|ส\.ต\.อ\.|ส\.ต\.ท\.|ส\.ต\.ต\.|ว่าที่ ร\.ต\.|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นาง|Mr\.|Mrs\.|Ms\.|Miss\s*)/i; //
	return fullName.replace(prefixRegex, '').trim(); //
};

// ฟังก์ชันสำหรับแยก ชื่อแรก ชื่อกลาง นามสกุล
const splitName = (fullName) => {
	if (!fullName || typeof fullName !== "string") { //
		return { first: null, middle: null, last: null }; //
	}
	const nameWithoutPrefix = removePrefix(fullName); //
	const parts = nameWithoutPrefix.split(/\s+/); //
	
	if (parts.length === 1) return { first: parts[0], middle: null, last: null }; //
	if (parts.length === 2) return { first: parts[0], middle: null, last: parts[1] }; //
	if (parts.length >= 3) { //
		const first = parts[0]; //
		const last = parts[parts.length - 1]; //
		const middle = parts.slice(1, parts.length - 1).join(" "); //
		return { first, middle, last }; //
	}
	return { first: null, middle: null, last: null }; //
};

exports.uploadExcel = async (req, res) => {
	try {
		if (!req.file) { //
			return res.status(400).json({ success: false, message: "กรุณาแนบไฟล์ Excel" }); //
		}

		// 1. อ่านข้อมูล Text ด้วย xlsx
		const workbookXlsx = xlsx.readFile(req.file.path); //
		const sheetName = workbookXlsx.SheetNames[0]; //
		const rawData = xlsx.utils.sheet_to_json(workbookXlsx.Sheets[sheetName]); //

		// 2. ดึงข้อมูลรูปภาพที่ฝังในเซลล์ ด้วย ExcelJS
		const workbookExt = new ExcelJS.Workbook(); //
		await workbookExt.xlsx.readFile(req.file.path); //
		const worksheetExt = workbookExt.worksheets[0]; //

		const imagesMap = {}; //
		
		// วนลูปรูปภาพทั้งหมดที่พบใน Sheet
		for (const image of worksheetExt.getImages()) { //
			const rowIdx = image.range.tl.nativeRow; //
			const imgInfo = workbookExt.getImage(image.imageId); //
			
			if (imgInfo && imgInfo.buffer) { //
				const ext = imgInfo.extension || 'jpeg';
				const fileName = `excel_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
				
				const fileBuffer = Buffer.from(imgInfo.buffer); //

				// ขั้นที่ 1: อัปโหลดขึ้นสู่คลัง Private Storage ปิดเงียบ (Service role ทะลุผ่าน RLS ไปเซฟให้)
				const { data: uploadData, error: uploadError } = await supabase.storage
					.from("upload") 
					.upload(fileName, fileBuffer, {
						contentType: `image/${ext}`,
						duplex: 'half', //
						upsert: true
					});

				if (uploadError) {
					console.error(`❌ ไม่สามารถเซฟรูปแถวที่ ${rowIdx + 1} ลงคลังได้เนื่องจาก:`, uploadError.message);
					continue;
				}

				// ขั้นที่ 2: ดึงข้อมูลไฟล์แบบดาวน์โหลด Stream (ดึง Buffer สดๆ กลับมาที่หลังบ้านทันที)
				const { data: fileData, error: downloadError } = await supabase.storage
					.from("upload")
					.download(fileName);

				if (downloadError) {
					console.error(`❌ ดึงไฟล์รูปแถวที่ ${rowIdx + 1} มาประมวลผลล้มเหลว:`, downloadError.message);
					continue;
				}

				// ขั้นที่ 3: แปลงก้อนข้อมูลภาพดิบจาก Supabase เป็น Base64 ของฝั่งหลังบ้านเราเอง
				if (fileData) {
					const arrayBuffer = await fileData.arrayBuffer();
					const base64String = Buffer.from(arrayBuffer).toString("base64");
					// เก็บในโครงสร้าง Data URL เพื่อใช้ Preview แสดงผล
					imagesMap[rowIdx] = `data:image/${ext};base64,${base64String}`;
				}
			}
		}

		// 3. Map ข้อมูล Excel เข้ากับโครงสร้างจำลอง DB
		const preview_data = rawData.map((row, index) => { //
			
			const thName = splitName(row["ชื่อ สกุล (ไทย)"]); //
			const enName = splitName(row["ชื่อ สกุล (อังกฤษ)"]); //

			const excelRowIndex = index + 1; //
			
			// ค่า photo_url ตอนนี้จะปลอดภัยเพราะบรรจุเป็นก้อน Base64 String ตรงๆ ไม่ใช่ที่อยู่ Link URL ใดๆ
			const photoDataStr = imagesMap[excelRowIndex] || row["รูปจาก ทร.14"] || null; 

			return {
				ลำดับที่อ่านได้: index + 1, //
				
				first_name_th: thName.first, //
				middle_name_th: thName.middle, //
				last_name_th: thName.last, //
				
				first_name_en: enName.first, //
				middle_name_en: enName.middle, //
				last_name_en: enName.last, //
				
				age: row["อายุ(ปี)"] || null, //
				id_card: row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"] || null, //
				passport: row["เลขพาสปอร์ต"] || null, //
				dob: row["วัน/เดือน/ปี เกิด"] || null, //
				address: row["ที่อยู่"] || null, //
				
				photo_url: photoDataStr, 
				
				case_id_count: row["จำนวน Case ID"] || null, //
				warrant: row["หมายจับ"] || null, //
				building: row["ตึก ที่ทำงาน"] || null, //
				floor: row["ชั้น ที่ทำงาน"] || null, //
				room: row["ห้อง ที่ทำงาน"] || null, //
				job_type: row["ประเภทงาน"] || null, //
				role: row["ทำหน้าที่"] || null, //
				salary: row["เงินเดือนที่ได้รับ(บาท)"] || null, //
				paid_by: row["รับเงินเดือนจากใคร"] || null, //
				payment_method: row["ช่องทางการรับเงินเดือน"] || null, //
				victim_indicator: row["มีข้อบ่งชี้ / ไม่มีข้อบ่งชี้ (เหยื่อ)"] || null, //
				responsible_agency: row["หน่วยงานที่รับผิดชอบ"] || null, //
				note: row["หมายเหตุ"] || null, //
				
				raw_data_from_excel: row //
			};
		});

		fs.unlinkSync(req.file.path); //

		res.status(200).json({
			success: true,
			message: "ระบบ Map ข้อมูล ดึงภาพแบบ Secure Stream ข้อมูล และแยกส่วนประกอบสำเร็จ",
			total_rows: rawData.length,
			preview_data: preview_data
		});

	} catch (error) {
		if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); //
		console.error("Error reading excel:", error); //
		res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการประมวลผล Excel: " + error.message }); //
	}
};