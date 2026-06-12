const { google } = require('googleapis');
const fs = require('fs');

// ดึงค่าการตั้งค่าจากไฟล์ .env
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

// สร้าง Client สำหรับจัดการ OAuth2
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// ส่ง Refresh Token เข้าไปเพื่อให้ไลบรารีเจน Access Token ใหม่อัตโนมัติเมื่อหมดอายุ
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// เรียกใช้งานเซอร์วิส Google Drive API
const driveService = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * อัพโหลดไฟล์ขึ้น Google Drive โดยใช้บัญชีส่วนตัวผ่านสิทธิ์ OAuth2
 * @param {Object} fileObject - ออบเจกต์ไฟล์ที่ได้รับมาจาก Multer (req.file)
 * @param {String} folderId - ID ของโฟลเดอร์ปลายทางใน Google Drive
 */
const uploadToDrive = async (fileObject, folderId) => {
  try {
    const fileMetadata = {
      name: fileObject.originalname,
    };

    // หากมีการกำหนด Folder ID ใน .env ให้จัดเก็บลงในโฟลเดอร์นั้น
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const media = {
      mimeType: fileObject.mimetype,
      body: fs.createReadStream(fileObject.path)
    };

    // ส่งคำสั่งสร้างไฟล์ไปยัง Google Drive API
    const response = await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    const fileId = response.data.id;

    // อัปเดตสิทธิ์ของไฟล์ (Permissions) ให้ทุกคนที่มีลิงก์สามารถเปิดดูเนื้อหาได้ (Reader)
    await driveService.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data;
  } catch (error) {
    console.error('[Drive Service Error]:', error.message);
    throw error;
  }
};

module.exports = { uploadToDrive };