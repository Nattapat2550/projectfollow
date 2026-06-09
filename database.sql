CREATE TABLE illegal_immigrants (
    id VARCHAR(50) PRIMARY KEY,
    first_name_th VARCHAR(255) NOT NULL,
    middle_name_th VARCHAR(255),
    last_name_th VARCHAR(255) NOT NULL,
    first_name_en VARCHAR(255),
    middle_name_en VARCHAR(255),
    last_name_en VARCHAR(255),
    passport_id VARCHAR(100) UNIQUE,
    detected_location VARCHAR(255) NOT NULL,
    is_victim BOOLEAN
);

CREATE TABLE deported_persons (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth TIMESTAMP NOT NULL,
    citizen_id VARCHAR(20) NOT NULL,
    passport_no VARCHAR(100),
    address TEXT NOT NULL,
    photo_url TEXT,
    case_id_count INTEGER NOT NULL DEFAULT 0,
    arrest_warrant VARCHAR(100) NOT NULL,
    return_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);