// backend/controllers/documentController.js
const supabase = require('../config/supabase');
const crypto = require('crypto');

// 1. อัปโหลดรูปภาพ (รับไฟล์จาก multer หรือ buffer)
exports.uploadSensitiveImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        // เจนชื่อไฟล์ใหม่ป้องกันการเดาพาธ
        const fileExtension = req.file.originalname.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExtension}`;
        const filePath = `user-docs/${fileName}`;

        // อัปโหลดเข้า Private Bucket
        const { data, error } = await supabase.storage
            .from('sensitive-documents')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) throw error;

        // บันทึก filePath (data.path) ลง Database (Prisma) ของคุณไว้ผูกกับ User
        // ... โค้ดบันทึก DB ...

        res.status(200).json({ message: 'Upload success', path: data.path });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. ดึงรูปภาพแบบปลอดภัย (สร้าง Signed URL หมดอายุภายใน 60 วินาที)
exports.getSensitiveImage = async (req, res) => {
    try {
        const { filePath } = req.body; // หรือดึงมาจาก DB ตาม id

        // 🔒 ตรงนี้คุณสามารถเช็คสิทธิ์ผู้ใช้ก่อนได้ (เช่น req.user.id มีสิทธิ์ดูรูปนี้ไหม)
        
        // สร้างลิงก์ชั่วคราว ดึงเสร็จแสดงผลแล้วลิงก์ตายทันที
        const { data, error } = await supabase.storage
            .from('sensitive-documents')
            .createSignedUrl(filePath, 60); // ลิงก์มีอายุ 60 วินาที

        if (error) throw error;

        res.status(200).json({ signedUrl: data.signedUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};