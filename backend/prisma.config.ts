import "dotenv/config"; // บรรทัดนี้สำคัญมาก มันจะไปโหลดค่าจากไฟล์ .env มาใส่ process.env
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // ใช้ค่าจาก .env ที่โหลดมาแล้ว
    url: process.env.DATABASE_URL, 
  },
});