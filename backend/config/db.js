const { Pool } = require("pg");
require("dotenv").config(); // โหลดไฟล์ .env

// ดึง Connection String จาก DATABASE_URL ใน .env
const connectionString = process.env.DATABASE_URL;

// เช็คว่าถ้าต่อ Localhost ไม่ต้องใช้ SSL แต่ถ้าต่อ Cloud (เช่น Render) ต้องใช้ SSL
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new Pool({
  connectionString: connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false } // Render บังคับใช้ SSL
});

// รับ client มาเพื่อเช็คสถานะ จากนั้นทำการ release ทันทีเพื่อป้องกัน Connection Leak
pool.connect()
  .then((client) => {
    console.log("✅ PostgreSQL (Render) Connected Successfully");
    client.release();
  })
  .catch((err) => {
    console.error("❌ PostgreSQL Connection error:");
    console.error(err.message);
  });

module.exports = pool;