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

const isLocalhost =
  !connectionString ||
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1");

if (!isLocalhost) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

let sanitizedConnectionString = connectionString;
if (sanitizedConnectionString && !isLocalhost) {
  if (sanitizedConnectionString.includes("sslmode=")) {
    sanitizedConnectionString = sanitizedConnectionString.replace(
      /sslmode=[^&]*/,
      "sslmode=no-verify"
    );
  } else {
    const separator = sanitizedConnectionString.includes("?") ? "&" : "?";
    sanitizedConnectionString = `${sanitizedConnectionString}${separator}sslmode=no-verify`;
  }
}

const poolConfig = sanitizedConnectionString
  ? { connectionString: sanitizedConnectionString }
  : host && user
  ? {
      host,
      user,
      password,
      database,
      port: Number(process.env.POSTGRES_PORT || 5432),
    }
  : { connectionString: process.env.DATABASE_URL };

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
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'victim_status_enum') THEN
              CREATE TYPE victim_status_enum AS ENUM ('YES', 'NO', 'PENDING');
          END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        color VARCHAR(7) DEFAULT '#3B82F6'
      );

      CREATE TABLE IF NOT EXISTS illegal_immigrants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name_th VARCHAR(255) NOT NULL,
          middle_name_th VARCHAR(255),
          last_name_th VARCHAR(255) NOT NULL,
          first_name_en VARCHAR(255),
          middle_name_en VARCHAR(255),
          last_name_en VARCHAR(255),
          gender VARCHAR(50),
          date_of_birth DATE,
          national_id VARCHAR(50),
          passport_id VARCHAR(255),
          nationality VARCHAR(255),
          photo_url TEXT,
          passport_photo_url TEXT,
          detected_location_details TEXT,
          detected_location_sub_district VARCHAR(255),
          detected_location_district VARCHAR(255),
          detected_location_province VARCHAR(255),
          detected_location_region VARCHAR(255),
          is_victim victim_status_enum NOT NULL DEFAULT 'PENDING',
          detected_date DATE,
          workplace VARCHAR(255),
          screening_details TEXT,
          note TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          created_by UUID REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS repatriated_persons (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name_th VARCHAR(255) NOT NULL,
          middle_name_th VARCHAR(255),
          last_name_th VARCHAR(255) NOT NULL,
          first_name_en VARCHAR(255),
          middle_name_en VARCHAR(255),
          last_name_en VARCHAR(255),
          gender VARCHAR(50),
          date_of_birth DATE,
          national_id VARCHAR(50) NOT NULL,
          passport_id VARCHAR(255),
          nationality VARCHAR(255),
          photo_url TEXT,
          passport_photo_url TEXT,
          address_details TEXT,
          sub_district VARCHAR(255),
          district VARCHAR(255),
          province VARCHAR(255),
          region VARCHAR(255),
          building VARCHAR(255),
          floor VARCHAR(100),
          room VARCHAR(100),
          job_type VARCHAR(255),
          role VARCHAR(255),
          salary VARCHAR(100),
          paid_by VARCHAR(255),
          payment_method VARCHAR(255),
          number_of_case INT NOT NULL DEFAULT 0,
          number_of_warrant INT NOT NULL DEFAULT 0,
          is_victim victim_status_enum NOT NULL DEFAULT 'PENDING',
          responsible_agency VARCHAR(255),
          return_date DATE,
          note TEXT,
          screening_details TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          created_by UUID REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_repatriated_persons_return_date ON repatriated_persons(return_date DESC NULLS LAST);
      CREATE INDEX IF NOT EXISTS idx_repatriated_persons_created_by ON repatriated_persons(created_by);
      CREATE INDEX IF NOT EXISTS idx_repatriated_persons_national_id ON repatriated_persons(national_id);
      CREATE INDEX IF NOT EXISTS idx_repatriated_persons_passport_id ON repatriated_persons(passport_id);
    `,
  )
  .then(() => {
    console.log("⚡ PostgreSQL Database schema and indexes verified/created");
  })
  .catch((err) => {
    console.error(
      "⚠️ Failed to verify/create PostgreSQL database schema:",
      err.message,
    );
  });

export default pool;
