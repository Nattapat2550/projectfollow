-- สร้าง Enum สำหรับ result ก่อน (เปลี่ยนจาก repatriated_result_enum)
CREATE TYPE repatriate_result_enum AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- สร้างตาราง users ก่อน เพื่อให้ตารางอื่นอ้างอิง Foreign Key (created_by) ได้
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  color VARCHAR(7) DEFAULT '#3B82F6'
);

-- ตาราง แอบเข้า (Illegal Immigrants)
CREATE TABLE illegal_immigrants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ข้อมูลพื้นฐานบุคคล (ซิงค์ให้เหมือนกับ Repatriated)
    first_name_th VARCHAR(255) NOT NULL,
    middle_name_th VARCHAR(255),
    last_name_th VARCHAR(255) NOT NULL,
    first_name_en VARCHAR(255),
    middle_name_en VARCHAR(255),
    last_name_en VARCHAR(255),
    gender VARCHAR(50),
    date_of_birth DATE,
    age INT,
    national_id VARCHAR(50) ,
    passport_id VARCHAR(255) ,
    nationality VARCHAR(255),
    photo_url TEXT,
    
    -- ข้อมูลเฉพาะกลุ่มลักลอบเข้าเมือง
    detected_location TEXT NOT NULL,
    is_victim BOOLEAN,
    detected_date DATE,
    workplace VARCHAR(255),
    screening_details TEXT,
    note TEXT,
    
    -- ส่วนที่เก็บข้อมูลคนที่เพิ่มและเวลาที่เพิ่ม
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ตาราง ส่งกลับ (Repatriated Persons) เปลี่ยนจาก Repatriated Persons
CREATE TABLE repatriated_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ข้อมูลพื้นฐานบุคคล (ซิงค์ให้เหมือนกับ Illegal)
    first_name_th VARCHAR(255) NOT NULL,
    middle_name_th VARCHAR(255),
    last_name_th VARCHAR(255) NOT NULL,
    first_name_en VARCHAR(255),
    middle_name_en VARCHAR(255),
    last_name_en VARCHAR(255),
    gender VARCHAR(50),
    date_of_birth DATE,
    age INT,
    national_id VARCHAR(50) NOT NULL,  -- คงค่า NOT NULL ไว้เผื่อใช้เป็นหลัก
    passport_id VARCHAR(255) ,
    nationality VARCHAR(255),                 -- เพิ่มเข้ามาใหม่
    photo_url TEXT,
    
    -- ข้อมูลสถานที่และรูปแบบงาน
    address TEXT NOT NULL,
    building VARCHAR(255),
    floor VARCHAR(100),
    room VARCHAR(100),
    job_type VARCHAR(255),
    role VARCHAR(255),
    
    -- ข้อมูลการเงิน
    salary VARCHAR(100),
    paid_by VARCHAR(255),
    payment_method VARCHAR(255),
    
    -- ข้อมูลทางคดีและหน่วยงาน
    number_of_case INT NOT NULL DEFAULT 0,
    number_of_warrant INT NOT NULL DEFAULT 0,
    victim_indicator VARCHAR(255),
    responsible_agency VARCHAR(255),
    
    -- ข้อมูลการส่งกลับและอื่นๆ
    return_date DATE,
    channel VARCHAR(255),
    note TEXT,
    result repatriate_result_enum NOT NULL DEFAULT 'PENDING',

    -- ส่วนที่เก็บข้อมูลคนที่เพิ่มและเวลาที่เพิ่ม
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);