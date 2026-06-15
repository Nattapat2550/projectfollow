const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new Pool({ connectionString, ssl: isLocalhost ? false : { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const { uploadToDrive } = require("../services/googleDriveService"); 

const removePrefix = (fullName) => {
    if (!fullName || typeof fullName !== "string") return fullName;
    const prefixRegex = /^(พล\.ต\.อ\.|พล\.ต\.ท\.|พล\.ต\.ต\.|พ\.ต\.อ\.|พ\.ต\.ท\.|พ\.ต\.ต\.|ร\.ต\.อ\.|ร\.ต\.ท\.|ร\.ต\.ต\.|ด\.ต\.|จ\.ส\.ต\.|ส\.ต\.อ\.|ส\.ต\.ท\.|ส\.ต\.ต\.|ว่าที่ ร\.ต\.|นางสาว|น\.ส\.|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|นาย|นาง|Mr\.|Mrs\.|Ms\.|Miss\s*)/i;
    return fullName.replace(prefixRegex, '').trim();
};

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

const determineGenderFromName = (fullName) => {
    if (!fullName || typeof fullName !== "string") return null;
    const prefixRegex = /^(นาย|นางสาว|น\.ส\.|นาง|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|Mr\.|Mrs\.|Ms\.|Miss)/i;
    const match = fullName.match(prefixRegex);
    
    if (match) {
        const prefix = match[1].toLowerCase().replace(/\s+/g, '');
        if (["นาย", "เด็กชาย", "ด.ช.", "mr."].includes(prefix)) return "ชาย";
        if (["นาง", "นางสาว", "น.ส.", "เด็กหญิง", "ด.ญ.", "mrs.", "ms.", "miss"].includes(prefix)) return "หญิง";
    }
    return null;
};

const parseThaiDOBToDate = (dobStr) => {
    if (dobStr == null || dobStr === '') return null;
    if (typeof dobStr === 'number') {
        return new Date(Math.round((dobStr - 25569) * 86400 * 1000));
    }
    const str = String(dobStr).trim();
    if (str === "ไม่ระบุ" || str === "-") return null;
    const parts = str.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        if (year > 2400) year -= 543;
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(Date.UTC(year, month - 1, day));
        }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
};

if (!global.uploadProgress) {
    global.uploadProgress = {};
}
  
exports.getUploadProgress = (req, res) => {
    const jobId = req.params.jobId;
    const progress = global.uploadProgress[jobId] || { current: 0, total: 0, status: 'pending' };
    res.json(progress);
};

exports.uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "กรุณาแนบไฟล์ Excel" });
        }

        const action = req.query.action || "upload";
        const jobId = req.query.jobId;

        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const workbookXlsx = xlsx.readFile(req.file.path);
        const sheetName = workbookXlsx.SheetNames[0];
        let rawData = xlsx.utils.sheet_to_json(workbookXlsx.Sheets[sheetName], { defval: null });

        // ✨ 1. แก้บัค: กรองแถวว่างทิ้งทั้งหมด (ป้องกัน Ghost Rows)
        rawData = rawData.filter(row => {
            const thName = row["ชื่อ สกุล (ไทย)"];
            const enName = row["ชื่อ สกุล (อังกฤษ)"];
            const idCard = row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"];
            const pass = row["เลขพาสปอร์ต"];
            return (thName && thName.trim() !== "") || (enName && enName.trim() !== "") || idCard || pass;
        });

        const workbookExt = new ExcelJS.Workbook();
        await workbookExt.xlsx.readFile(req.file.path);
        const worksheetExt = workbookExt.worksheets[0];

        const imagesMap = {};
        for (const image of worksheetExt.getImages()) {
            const rowIdx = image.range.tl.nativeRow; 
            const imgInfo = workbookExt.getImage(image.imageId);
            
            if (imgInfo && imgInfo.buffer) {
                imagesMap[rowIdx] = {
                    buffer: imgInfo.buffer,
                    extension: imgInfo.extension || 'jpeg'
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
                const autoGender = determineGenderFromName(rawThName) || determineGenderFromName(rawEnName) || (row["เพศ"] ? String(row["เพศ"]).trim() : null);

                const raw_id = row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"];
                const id_card = raw_id ? String(raw_id).replace(/[^0-9a-zA-Z]/g, '') : `NO_ID_${i}`;
                
                const dobDate = parseThaiDOBToDate(row["วัน/เดือน/ปี เกิด"]);
                const dobDisplay = dobDate ? dobDate.toISOString().split('T')[0] : "ไม่ระบุ";
                
                let photo_url_preview = null;
                if (imagesMap[i + 1]) {
                    const base64Data = imagesMap[i + 1].buffer.toString('base64');
                    const mimeType = imagesMap[i + 1].extension === 'png' ? 'image/png' : 'image/jpeg';
                    photo_url_preview = `data:${mimeType};base64,${base64Data}`;
                } else if (row["รูปจาก ทร.14"]) {
                    photo_url_preview = String(row["รูปจาก ทร.14"]);
                }

                preview_data.push({
                    ลำดับที่อ่านได้: i + 1,
                    first_name_th: thName.first || "ไม่ระบุ",
                    last_name_th: thName.last || "ไม่ระบุ",
                    first_name_en: enName.first || null,
                    last_name_en: enName.last || null,
                    age: parseInt(row["อายุ(ปี)"]) || null,
                    dob: dobDisplay,
                    gender: autoGender,
                    id_card: id_card,
                    passport: row["เลขพาสปอร์ต"] ? String(row["เลขพาสปอร์ต"]).trim() : null,
                    photo_url: photo_url_preview,
                    case_id_count: parseInt(row["จำนวน Case ID"]) || 0,
                    warrant: parseInt(row["หมายจับ"]) || 0,
                    raw_data_from_excel: row
                });
            }
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); 
            return res.status(200).json({ success: true, message: "ดึงข้อมูลพรีวิวและรูปภาพสำเร็จ", total_rows: preview_data.length, preview_data });
        }

        // ================= โหมดอัปโหลด =================
        let successCount = 0;
        let errors = [];

        if (jobId) {
            global.uploadProgress[jobId] = { current: 0, total: rawData.length, status: 'processing' };
        }

        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const rawThName = row["ชื่อ สกุล (ไทย)"];
            const rawEnName = row["ชื่อ สกุล (อังกฤษ)"];
            
            const thName = splitName(rawThName);
            const enName = splitName(rawEnName);
            const autoGender = determineGenderFromName(rawThName) || determineGenderFromName(rawEnName) || (row["เพศ"] ? String(row["เพศ"]).trim() : null);

            const excelRowIndex = i + 1; 

            let drivePhotoUrl = null;
            const imgData = imagesMap[excelRowIndex];

            if (imgData) {
                try {
                    const tempFileName = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}.${imgData.extension}`;
                    const tempFilePath = path.join(uploadsDir, tempFileName);
                    
                    fs.writeFileSync(tempFilePath, imgData.buffer);
                    
                    const fileObject = {
                        originalname: tempFileName,
                        mimetype: `image/${imgData.extension}`,
                        path: tempFilePath
                    };
                    
                    const driveResult = await uploadToDrive(fileObject, process.env.GOOGLE_DRIVE_FOLDER_ID);
                    drivePhotoUrl = driveResult.webViewLink; 
                    
                    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                } catch (uploadErr) {
                    console.error("Drive Upload Error:", uploadErr);
                }
            } else if (row["รูปจาก ทร.14"]) {
                drivePhotoUrl = String(row["รูปจาก ทร.14"]);
            }

            // ✨ 2. แก้บัค: จัดการเรื่องบัตรปชช./พาสปอร์ต ซ้ำซ้อน หรือมีอักขระเว้นวรรค
            const raw_id = row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"];
            let id_card = raw_id ? String(raw_id).replace(/[^0-9a-zA-Z]/g, '') : `NO_ID_${Date.now()}_${i}`;
            
            const raw_pass = row["เลขพาสปอร์ต"];
            let passport = raw_pass ? String(raw_pass).replace(/\s/g, '').trim() : null;
            if (passport && ["-", "ไม่มี", "ไม่ระบุ", "none", "n/a", "null", "ไม่มีหนังสือเดินทาง"].includes(passport.toLowerCase())) {
                passport = null; // ป้องกัน Database ชนกันด้วยเครื่องหมาย -
            }

            const dobDate = parseThaiDOBToDate(row["วัน/เดือน/ปี เกิด"]);
            const caseCount = parseInt(row["จำนวน Case ID"]);
            const warrantCount = parseInt(row["หมายจับ"]);
            const parsedAge = parseInt(row["อายุ(ปี)"]);

            try {
                // ✨ 3. แก้บัค: ใช้ระบบหาข้อมูลเก่า ถ้ามีให้อัปเดตทับ (ป้องกัน Error Duplicate Key)
                let existingPerson = null;
                
                if (!id_card.startsWith("NO_ID_")) {
                    existingPerson = await prisma.deported_persons.findUnique({
                        where: { national_id: id_card }
                    });
                }
                
                if (!existingPerson && passport) {
                    existingPerson = await prisma.deported_persons.findUnique({
                        where: { passport_id: passport }
                    });
                }

                const dataPayload = {
                    first_name_th: thName.first || "ไม่ระบุ",
                    middle_name_th: thName.middle || null,
                    last_name_th: thName.last || "ไม่ระบุ",
                    first_name_en: enName.first || null,
                    middle_name_en: enName.middle || null,
                    last_name_en: enName.last || null,
                    
                    date_of_birth: dobDate, 
                    gender: autoGender,
                    age: isNaN(parsedAge) ? null : parsedAge,
                    national_id: id_card,
                    passport_id: passport,
                    address: row["ที่อยู่"] ? String(row["ที่อยู่"]) : "ไม่ระบุ",
                    
                    building: row["ตึก ที่ทำงาน"] ? String(row["ตึก ที่ทำงาน"]) : null,
                    floor: row["ชั้น ที่ทำงาน"] ? String(row["ชั้น ที่ทำงาน"]) : null,
                    room: row["ห้อง ที่ทำงาน"] ? String(row["ห้อง ที่ทำงาน"]) : null,
                    job_type: row["ประเภทงาน"] ? String(row["ประเภทงาน"]) : null,
                    role: row["ทำหน้าที่"] ? String(row["ทำหน้าที่"]) : null,
                    
                    salary: row["เงินเดือนที่ได้รับ(บาท)"] ? String(row["เงินเดือนที่ได้รับ(บาท)"]) : null,
                    paid_by: row["รับเงินเดือนจากใคร"] ? String(row["รับเงินเดือนจากใคร"]) : null,
                    payment_method: row["ช่องทางการรับเงินเดือน"] ? String(row["ช่องทางการรับเงินเดือน"]) : null,
                    
                    number_of_case: isNaN(caseCount) ? 0 : caseCount,
                    number_of_warrant: isNaN(warrantCount) ? 0 : warrantCount,
                    victim_indicator: row["มีข้อบ่งชี้ / ไม่มีข้อบ่งชี้ (เหยื่อ)"] ? String(row["มีข้อบ่งชี้ / ไม่มีข้อบ่งชี้ (เหยื่อ)"]) : null,
                    responsible_agency: row["หน่วยงานที่รับผิดชอบ"] ? String(row["หน่วยงานที่รับผิดชอบ"]) : null,
                    note: row["หมายเหตุ"] ? String(row["หมายเหตุ"]) : null,
                };

                // อัปเดตรูปใหม่เฉพาะกรณีที่ดึงรูปจาก Excel มาได้สำเร็จ
                if (drivePhotoUrl) {
                    dataPayload.photo_url = drivePhotoUrl;
                }

                if (existingPerson) {
                    // ถ้าเคยมีอยู่แล้ว ให้อัปเดตข้อมูลทับของเดิม
                    await prisma.deported_persons.update({
                        where: { id: existingPerson.id },
                        data: dataPayload
                    });
                } else {
                    // ถ้ายังไม่เคยมี ให้สร้างใหม่
                    await prisma.deported_persons.create({
                        data: dataPayload
                    });
                }

                successCount++;
            } catch (dbErr) {
                errors.push(`แถวที่ ${i + 1} (${thName.first || "ไม่ระบุ"}): ${dbErr.message}`);
            }

            if (jobId && global.uploadProgress[jobId]) {
                global.uploadProgress[jobId].current = i + 1;
            }
        }

        if (jobId && global.uploadProgress[jobId]) global.uploadProgress[jobId].status = 'completed';

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: `อัปโหลดและบันทึกข้อมูลลง DB สำเร็จ ${successCount} จาก ${rawData.length} รายการ`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการประมวลผลระบบ: " + error.message });
    }
};