const { google } = require('googleapis');
const fs = require('fs');

// ดึงค่าการตั้งค่าจากไฟล์ .env
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const driveService = google.drive({ version: 'v3', auth: oauth2Client });

const uploadToDrive = async (fileObject, folderId) => {
  try {
    const fileMetadata = {
      name: fileObject.originalname,
    };

    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const media = {
      mimeType: fileObject.mimetype,
      body: fs.createReadStream(fileObject.path)
    };

    const response = await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    const fileId = response.data.id;

    await driveService.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return response.data;
  } catch (error) {
    console.error('[Drive Service Upload Error]:', error.message);
    throw error;
  }
};

const deleteFromDrive = async (fileId) => {
  try {
    if (!fileId) return;
    await driveService.files.delete({ fileId: fileId });
    console.log(`[Drive Service]: Deleted file ${fileId} successfully.`);
    return true;
  } catch (error) {
    console.error('[Drive Service Delete Error]:', error.message);
    throw error;
  }
};

const extractDriveFileId = (url) => {
  if (!url) return null;
  const matchIdParam = url.match(/id=([^&]+)/);
  if (matchIdParam) return matchIdParam[1];
  
  const matchPath = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchPath) return matchPath[1];

  return null;
};

module.exports = { uploadToDrive, deleteFromDrive, extractDriveFileId };