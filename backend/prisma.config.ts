import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// โหลดไฟล์ environment ให้ตรงกับ Path ของโปรเจกต์คุณ
dotenv.config({ path: "./config/config.env" });

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});