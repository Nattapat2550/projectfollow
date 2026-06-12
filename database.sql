-- สร้าง Enum สำหรับ result ก่อน
CREATE TYPE deported_result_enum AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- ตาราง แอบเข้า (Illegal Immigrants)
CREATE TABLE illegal_immigrants (
    id VARCHAR(255) PRIMARY KEY,
    first_name_th VARCHAR(255) NOT NULL,
    middle_name_th VARCHAR(255),
    last_name_th VARCHAR(255) NOT NULL,
    first_name_en VARCHAR(255),
    middle_name_en VARCHAR(255),
    last_name_en VARCHAR(255),
    nationality VARCHAR(255),
    passport_id VARCHAR(255) UNIQUE,
    detected_location TEXT NOT NULL,
    is_victim BOOLEAN,
    gender VARCHAR(50),
    detected_date DATE,
    workplace VARCHAR(255),
    screening_details TEXT
);

-- ตาราง ส่งกลับ (Deported Persons)
CREATE TABLE deported_persons (
    id VARCHAR(255) PRIMARY KEY,
    first_name_th VARCHAR(255) NOT NULL,
    middle_name_th VARCHAR(255),
    last_name_th VARCHAR(255) NOT NULL,
    first_name_en VARCHAR(255),
    middle_name_en VARCHAR(255),
    last_name_en VARCHAR(255),
    date_of_birth VARCHAR(50) NOT NULL,
    national_id VARCHAR(50) UNIQUE NOT NULL,
    passport_id VARCHAR(255) UNIQUE,
    number_of_case INT NOT NULL DEFAULT 0,
    number_of_warrant INT NOT NULL DEFAULT 0,
    address TEXT NOT NULL,
    age INT,
    return_date DATE,
    channel VARCHAR(255),
    result deported_result_enum NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  color VARCHAR(7) DEFAULT '#3B82F6'
);