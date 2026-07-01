-- สร้าง Enum สำหรับสถานะผู้เสียหาย (is_victim)
CREATE TYPE victim_status_enum AS ENUM ('YES', 'NO', 'PENDING');

-- สร้างตาราง users ก่อน
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
    
    -- ข้อมูลพื้นฐานบุคคล 
    first_name_th VARCHAR(255) NOT NULL,
    middle_name_th VARCHAR(255),
    last_name_th VARCHAR(255) NOT NULL,
    first_name_en VARCHAR(255),
    middle_name_en VARCHAR(255),
    last_name_en VARCHAR(255),
    gender VARCHAR(50),
    date_of_birth DATE,
    national_id VARCHAR(50) ,
    passport_id VARCHAR(255) ,
    nationality VARCHAR(255),
    photo_url TEXT,
    passport_photo_url TEXT,
    
    -- ข้อมูลเฉพาะกลุ่มลักลอบเข้าเมือง
    detected_location_details TEXT,
    detected_location_sub_district VARCHAR(255),
    detected_location_district VARCHAR(255),
    detected_location_province VARCHAR(255),
    is_victim victim_status_enum NOT NULL DEFAULT 'PENDING',  -- เปลี่ยนเป็น ENUM แล้ว
    detected_date DATE,
    workplace VARCHAR(255),
    screening_details TEXT,
    note TEXT,
    
    -- ส่วนที่เก็บข้อมูลคนที่เพิ่มและเวลาที่เพิ่ม
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ตาราง ส่งกลับ (Repatriated Persons)
CREATE TABLE repatriated_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ข้อมูลพื้นฐานบุคคล 
    first_name_th VARCHAR(255) NOT NULL,
    middle_name_th VARCHAR(255),
    last_name_th VARCHAR(255) NOT NULL,
    first_name_en VARCHAR(255),
    middle_name_en VARCHAR(255),
    last_name_en VARCHAR(255),
    gender VARCHAR(50),
    date_of_birth DATE,
    national_id VARCHAR(50) NOT NULL,
    passport_id VARCHAR(255) ,
    nationality VARCHAR(255),                 
    photo_url TEXT,
    passport_photo_url TEXT,
    
    -- ข้อมูลสถานที่และรูปแบบงาน
    address_details TEXT,
    sub_district VARCHAR(255),
    district VARCHAR(255),
    province VARCHAR(255),
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
    is_victim victim_status_enum NOT NULL DEFAULT 'PENDING',
    responsible_agency VARCHAR(255),
    
    -- ข้อมูลการส่งกลับและอื่นๆ
    return_date DATE,
    channel VARCHAR(255),
    note TEXT,
    screening_details TEXT,

    -- ส่วนที่เก็บข้อมูลคนที่เพิ่มและเวลาที่เพิ่ม
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);