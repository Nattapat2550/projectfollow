import {  Pool  } from "pg";

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new Pool({
  connectionString: connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  // ⚡ เพิ่มเพื่อประสิทธิภาพการดึงและอัพโหลดข้อมูลที่ไวที่สุด
  max: 25,                 // จำนวน Client สูงสุดใน Pool
  idleTimeoutMillis: 30000, // ปิด Connection ที่ไม่ได้ใช้งานภายใน 30 วินาที
  connectionTimeoutMillis: 10000, // Timeout ถ้าต่อฐานข้อมูลไม่ได้ภายใน 10 วินาที (ช่วยให้เซิร์ฟเวอร์ตอบกลับไวขึ้นเมื่อมีปัญหา)
});

pool.connect()
  .then(async (client) => {
    console.log("✅ PostgreSQL Connected Successfully & Pool Optimized");
    client.release();
    
    // Auto-create indexes to maximize query performance (especially for test-upload / test-upload2 duplicate checks and sorting)
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_repatriated_persons_return_date ON repatriated_persons(return_date DESC NULLS LAST);
        CREATE INDEX IF NOT EXISTS idx_repatriated_persons_created_by ON repatriated_persons(created_by);
        CREATE INDEX IF NOT EXISTS idx_repatriated_persons_national_id ON repatriated_persons(national_id);
        CREATE INDEX IF NOT EXISTS idx_repatriated_persons_passport_id ON repatriated_persons(passport_id);
      `);
      console.log("⚡ PostgreSQL Database indexes verified/created");
    } catch (indexErr) {
      console.error("⚠️ Failed to verify/create PostgreSQL database indexes:", indexErr.message);
    }
  })
  .catch((err) => {
    console.error("❌ PostgreSQL Connection error:", err.message);
  });

export default pool;