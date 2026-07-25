import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.projectfollow1_POSTGRES_URL ||
  process.env.POSTGRES_URL ||
  process.env.projectfollow1_POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.projectfollow1_POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_URL_NON_POOLING;

const host =
  process.env.projectfollow1_POSTGRES_HOST ||
  process.env.POSTGRES_HOST ||
  process.env.PGHOST;

const user =
  process.env.projectfollow1_POSTGRES_USER ||
  process.env.POSTGRES_USER ||
  process.env.PGUSER;

const password =
  process.env.projectfollow1_POSTGRES_PASSWORD ||
  process.env.POSTGRES_PASSWORD ||
  process.env.PGPASSWORD;

const database =
  process.env.projectfollow1_POSTGRES_DATABASE ||
  process.env.POSTGRES_DATABASE ||
  process.env.PGDATABASE;

const poolConfig = connectionString
  ? { connectionString }
  : host && user
  ? {
      host,
      user,
      password,
      database,
      port: Number(process.env.POSTGRES_PORT || 5432),
    }
  : { connectionString: process.env.DATABASE_URL };

const isLocalhost =
  !connectionString ||
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

const pool = new Pool({
  ...poolConfig,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
  // ⚡ เพิ่มเพื่อประสิทธิภาพการดึงและอัพโหลดข้อมูลที่ไวที่สุด
  max: 25, // จำนวน Client สูงสุดใน Pool
  idleTimeoutMillis: 30000, // ปิด Connection ที่ไม่ได้ใช้งานภายใน 30 วินาที
  connectionTimeoutMillis: 10000, // Timeout ถ้าต่อฐานข้อมูลไม่ได้ภายใน 10 วินาที (ช่วยให้เซิร์ฟเวอร์ตอบกลับไวขึ้นเมื่อมีปัญหา)
});

pool
  .query(
    `
      CREATE INDEX IF NOT EXISTS idx_repatriated_persons_return_date ON repatriated_persons(return_date DESC NULLS LAST);
      CREATE INDEX IF NOT EXISTS idx_repatriated_persons_created_by ON repatriated_persons(created_by);
      CREATE INDEX IF NOT EXISTS idx_repatriated_persons_national_id ON repatriated_persons(national_id);
      CREATE INDEX IF NOT EXISTS idx_repatriated_persons_passport_id ON repatriated_persons(passport_id);
    `,
  )
  .then(() => {
    console.log("⚡ PostgreSQL Database indexes verified/created");
  })
  .catch((err) => {
    console.error(
      "⚠️ Failed to verify/create PostgreSQL database indexes:",
      err.message,
    );
  });

export default pool;
