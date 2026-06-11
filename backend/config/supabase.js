// โหลด dotenv เผื่อไว้กรณีที่ Environment ยังเข้ามาไม่ถึงไฟล์นี้
require('dotenv').config(); 
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') }); // โหลด config.env ถ้ามี

const { createClient } = require('@supabase/supabase-js');

// ดึงค่าตามลำดับ หากในกระบวนการหลักใช้ชื่ออื่น หรือสลับไฟล์จะได้ไม่พัง
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ป้องกันแอป Crash พร้อมบอกใบ้ว่าดึงค่าได้มาจากไหน
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Missing Supabase Environment Variables!");
  console.error("SUPABASE_URL:", supabaseUrl ? "Found" : "Missing");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "Found" : "Missing");
}

// ใช้ Service Role เพื่อให้ Backend มีสิทธิ์จัดการไฟล์ Private ได้เต็มที่
const supabase = createClient(supabaseUrl || 'https://placeholder-url-to-prevent-crash.supabase.co', supabaseServiceKey || 'placeholder-key');

module.exports = supabase;