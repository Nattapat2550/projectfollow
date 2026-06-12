const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

// 1. นำเข้า Prisma และ Adapter
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new Pool({ connectionString, ssl: isLocalhost ? false : { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// 2. นำเข้า Service สำหรับอัปโหลดขึ้น Google Drive 
const { uploadToDrive } = require("../services/googleDriveService"); 

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

exports.uploadExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "กรุณาแนบไฟล์ Excel" });
        }

        // ตรวจสอบและสร้างโฟลเดอร์ uploads ชั่วคราว (ถ้ายังไม่มี)
        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // 1. อ่านข้อมูล Text ด้วย xlsx
        const workbookXlsx = xlsx.readFile(req.file.path);
        const sheetName = workbookXlsx.SheetNames[0];
        const rawData = xlsx.utils.sheet_to_json(workbookXlsx.Sheets[sheetName], { defval: null });

        // 2. ดึงข้อมูลรูปภาพที่ฝังในเซลล์ ด้วย ExcelJS
        const workbookExt = new ExcelJS.Workbook();
        await workbookExt.xlsx.readFile(req.file.path);
        const worksheetExt = workbookExt.worksheets[0];

        const imagesMap = {};
        for (const image of worksheetExt.getImages()) {
            const rowIdx = image.range.tl.nativeRow; 
            const imgInfo = workbookExt.getImage(image.imageId);
            
            if (imgInfo && imgInfo.buffer) {
                // เก็บ buffer เอาไว้เขียนเป็นไฟล์ชั่วคราวเพื่ออัปโหลด
                imagesMap[rowIdx] = {
                    buffer: imgInfo.buffer,
                    extension: imgInfo.extension || 'jpeg'
                };
            }
        }

        let successCount = 0;
        let errors = [];

        // 3. วนลูปอ่านข้อมูล Map เข้า Database และอัปโหลดรูป
        for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            const thName = splitName(row["ชื่อ สกุล (ไทย)"]);
            const enName = splitName(row["ชื่อ สกุล (อังกฤษ)"]);
            const excelRowIndex = i + 1; 

            // 3.1 จัดการอัปโหลดรูปลง Google Drive
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

            // 3.2 แปลงค่าตัวเลขและป้องกันค่าว่าง
            const id_card = row["เลขประจำตัวประชาขน"] || row["เลขประจำตัวประชาชน"] || `NO_ID_${Date.now()}_${i}`;
            const dob = row["วัน/เดือน/ปี เกิด"] ? String(row["วัน/เดือน/ปี เกิด"]) : "ไม่ระบุ";
            const passport = row["เลขพาสปอร์ต"] ? String(row["เลขพาสปอร์ต"]).trim() : null;
            
            const caseCount = parseInt(row["จำนวน Case ID"]);
            const warrantCount = parseInt(row["หมายจับ"]);
            const parsedAge = parseInt(row["อายุ(ปี)"]);

            // 3.3 บันทึกข้อมูลลงฐานข้อมูล
            try {
                await prisma.deported_persons.create({
                    data: {
                        first_name_th: thName.first || "ไม่ระบุ",
                        middle_name_th: thName.middle || null,
                        last_name_th: thName.last || "ไม่ระบุ",
                        first_name_en: enName.first || null,
                        middle_name_en: enName.middle || null,
                        last_name_en: enName.last || null,
                        
                        date_of_birth: dob,
                        age: isNaN(parsedAge) ? null : parsedAge,
                        national_id: String(id_card).trim(),
                        passport_id: passport === "-" || passport === "" ? null : passport,
                        address: row["ที่อยู่"] ? String(row["ที่อยู่"]) : "ไม่ระบุ",
                        photo_url: drivePhotoUrl,
                        
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
                    }
                });
                successCount++;
            } catch (dbErr) {
                console.error(`DB Insert Error row ${i}:`, dbErr.message);
                errors.push(`แถวที่ ${i + 1}: ${dbErr.message}`);
            }
        }

        // ลบไฟล์ Excel ทิ้งหลังประมวลผลเสร็จสิ้น
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: `อัปโหลดรูปลง Google Drive และบันทึกข้อมูลลง DB สำเร็จ ${successCount} จาก ${rawData.length} รายการ`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Error processing excel:", error);
        res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการประมวลผลระบบ: " + error.message });
    }
};