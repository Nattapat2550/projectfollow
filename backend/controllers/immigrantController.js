const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const xlsx = require("xlsx");
const { uploadToDrive, deleteFromDrive, extractDriveFileId } = require("../services/googleDriveService");

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

const pool = new Pool({ connectionString, ssl: isLocalhost ? false : { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ================= ฟังก์ชันช่วยเหลือ (Helpers) =================

const parseThaiDateToDate = (text) => {
  if (!text) return null;
  const thaiMonths = { "ม.ค.": "01", "ก.พ.": "02", "มี.ค.": "03", "เม.ย.": "04", "พ.ค.": "05", "มิ.ย.": "06", "ก.ค.": "07", "ส.ค.": "08", "ก.ย.": "09", "ต.ค.": "10", "พ.ย.": "11", "ธ.ค.": "12" };
  const match = String(text).match(/(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{2})/);
  if (!match) return null;
  const year = parseInt(match[2]) + 2500 - 543;
  return new Date(`${year}-${thaiMonths[match[1]]}-01T00:00:00Z`);
};

const findValue = (rowObj, keyword) => {
  const cleanStr = (str) => str.replace(/[\s\-\–\—\_]+/g, '');
  const cleanKeyword = cleanStr(keyword);
  let matchedKey = Object.keys(rowObj).find(k => cleanStr(k) === cleanKeyword) || Object.keys(rowObj).find(k => cleanStr(k).includes(cleanKeyword));
  return matchedKey ? rowObj[matchedKey] : null;
};

const processName = (rawFullName) => {
  let cleanFullName = String(rawFullName).trim();
  const prefixRegex = /^(นาย|นางสาว|นาง|น\.ส\.|น\.ส|ด\.ช\.|ด\.ญ\.|ด\.ช|ด\.ญ|Mr\.|Mrs\.|Ms\.|Miss\.|Master\.|Mr|Mrs|Ms|Miss|Master)\s*/i;
  const matchPrefix = cleanFullName.match(prefixRegex);
  
  const prefix = matchPrefix ? matchPrefix[1].trim() : "";
  if (matchPrefix) cleanFullName = cleanFullName.substring(matchPrefix[0].length).trim();

  const parts = cleanFullName.split(/\s+/).filter(p => p !== "");
  const fname = parts[0] || "";
  const mname = parts.length >= 3 ? parts[1] : null;
  const lname = parts.length === 2 ? parts[1] : parts.length >= 3 ? parts.slice(2).join(" ") : "";
  const isThai = /[ก-๙]/.test(cleanFullName);

  return { prefix, fname, mname, lname, isThai, hasName: !!(fname || lname) };
};

const processVictimStatus = (row) => {
  const rawScreening = findValue(row, "ผลการคัดกรอง") || findValue(row, "เป็นผู้เสียหาย");
  const screeningStr = rawScreening != null ? String(rawScreening).trim() : "";
  const isNotEmpty = screeningStr !== "" && !["-", "–", "—"].includes(screeningStr);

  if (isNotEmpty) return { isVictim: true, details: screeningStr };

  const emptyKey = Object.keys(row).find(k => k.startsWith("__EMPTY") && row[k] != null && String(row[k]).trim() !== "" && !["-", "–", "—"].includes(String(row[k]).trim()));
  return { isVictim: false, details: emptyKey ? String(row[emptyKey]).trim() : "ไม่เป็นผู้เสียหาย (ไม่มีข้อความอธิบายในไฟล์)" };
};

const determineGender = (row, prefix) => {
  let gender = findValue(row, "เพศ") || findValue(row, "Gender");
  if (!gender && prefix) {
    const p = prefix.toLowerCase();
    if (["นาย", "ด.ช.", "ด.ช", "mr", "mr.", "master", "master.", "boy", "mister"].includes(p)) return "ชาย";
    if (["นาง", "นางสาว", "น.ส.", "น.ส", "ด.ญ.", "ด.ญ", "miss", "miss.", "mrs", "mrs.", "ms", "ms.", "girl"].includes(p)) return "หญิง";
  }
  return gender || null;
};

// ✨ ระบบ Map สัญชาติ (ครอบคลุมทั่วโลก)
const normalizeNationality = (rawNat) => {
  if (!rawNat) return null;
  
  // แปลงเป็นตัวพิมพ์เล็กทั้งหมดเพื่อตรวจสอบง่าย และลบคำนำหน้าที่ไม่จำเป็น
  let nat = String(rawNat).trim().toLowerCase();
  nat = nat.replace(/^(ประเทศ|ชาว|สัญชาติ|คน)\s*/g, '').trim();

  const countryMap = {
      // 1. กลุ่มอาเซียนและประเทศเพื่อนบ้าน (พบบ่อยที่สุด)
      "ไทย": "ไทย", "thai": "ไทย", "thailand": "ไทย", "th": "ไทย", "ไท": "ไทย",
      "พม่า": "เมียนมา", "เมียนมา": "เมียนมา", "เมียนมาร์": "เมียนมา", "myanmar": "เมียนมา", "burma": "เมียนมา", "mm": "เมียนมา", "เมืยนมา": "เมียนมา", "เมียมา": "เมียนมา",
      "ลาว": "ลาว", "lao": "ลาว", "laos": "ลาว", "สปป.ลาว": "ลาว", "สปป ลาว": "ลาว",
      "กัมพูชา": "กัมพูชา", "เขมร": "กัมพูชา", "cambodia": "กัมพูชา", "khmer": "กัมพูชา", "กัมพูซา": "กัมพูชา",
      "เวียดนาม": "เวียดนาม", "เวียตนาม": "เวียดนาม", "vietnam": "เวียดนาม", "viet nam": "เวียดนาม", "vn": "เวียดนาม", "เวียด": "เวียดนาม",
      "มาเลเซีย": "มาเลเซีย", "มาเล": "มาเลเซีย", "malaysia": "มาเลเซีย", "malay": "มาเลเซีย", "my": "มาเลเซีย",
      "อินโดนีเซีย": "อินโดนีเซีย", "อินโด": "อินโดนีเซีย", "indonesia": "อินโดนีเซีย", "id": "อินโดนีเซีย",
      "ฟิลิปปินส์": "ฟิลิปปินส์", "ฟิลิปปิน": "ฟิลิปปินส์", "philippines": "ฟิลิปปินส์", "philippine": "ฟิลิปปินส์", "ph": "ฟิลิปปินส์", "ฟิลลิปปินส์": "ฟิลิปปินส์",
      "สิงคโปร์": "สิงคโปร์", "singapore": "สิงคโปร์", "sg": "สิงคโปร์", "สิงคโปร": "สิงคโปร์",
      "บรูไน": "บรูไน", "brunei": "บรูไน",
      "ติมอร์-เลสเต": "ติมอร์-เลสเต", "timor-leste": "ติมอร์-เลสเต", "ติมอร์": "ติมอร์-เลสเต", "timor": "ติมอร์-เลสเต",

      // 2. ทวีปเอเชียตะวันออกและเอเชียใต้
      "จีน": "จีน", "china": "จีน", "chinese": "จีน", "cn": "จีน", "สาธารณรัฐประชาชนจีน": "จีน", "ไชน่า": "จีน", "จีนแดง": "จีน",
      "ญี่ปุ่น": "ญี่ปุ่น", "japan": "ญี่ปุ่น", "jp": "ญี่ปุ่น", "เจแปน": "ญี่ปุ่น", "japanese": "ญี่ปุ่น",
      "เกาหลีใต้": "เกาหลีใต้", "เกาหลี": "เกาหลีใต้", "south korea": "เกาหลีใต้", "korea": "เกาหลีใต้", "kr": "เกาหลีใต้", "เกาหลีไต้": "เกาหลีใต้", "republic of korea": "เกาหลีใต้",
      "เกาหลีเหนือ": "เกาหลีเหนือ", "north korea": "เกาหลีเหนือ", "dprk": "เกาหลีเหนือ",
      "ไต้หวัน": "ไต้หวัน", "taiwan": "ไต้หวัน", "tw": "ไต้หวัน",
      "ฮ่องกง": "ฮ่องกง", "hong kong": "ฮ่องกง", "hongkong": "ฮ่องกง", "hk": "ฮ่องกง",
      "มาเก๊า": "มาเก๊า", "macau": "มาเก๊า", "macao": "มาเก๊า",
      "อินเดีย": "อินเดีย", "india": "อินเดีย", "in": "อินเดีย", "แขก": "อินเดีย", "indian": "อินเดีย",
      "บังกลาเทศ": "บังกลาเทศ", "บังคลาเทศ": "บังกลาเทศ", "bangladesh": "บังกลาเทศ",
      "ปากีสถาน": "ปากีสถาน", "pakistan": "ปากีสถาน",
      "ศรีลังกา": "ศรีลังกา", "sri lanka": "ศรีลังกา",
      "เนปาล": "เนปาล", "nepal": "เนปาล",
      "อัฟกานิสถาน": "อัฟกานิสถาน", "afghanistan": "อัฟกานิสถาน",
      "มัลดีฟส์": "มัลดีฟส์", "maldives": "มัลดีฟส์",
      "ภูฏาน": "ภูฏาน", "bhutan": "ภูฏาน",

      // 3. เอเชียตะวันออกกลาง
      "อิหร่าน": "อิหร่าน", "iran": "อิหร่าน",
      "อิรัก": "อิรัก", "iraq": "อิรัก",
      "ซาอุดีอาระเบีย": "ซาอุดีอาระเบีย", "ซาอุ": "ซาอุดีอาระเบีย", "saudi arabia": "ซาอุดีอาระเบีย", "saudi": "ซาอุดีอาระเบีย",
      "สหรัฐอาหรับเอมิเรตส์": "ยูเออี", "uae": "ยูเออี", "ยูเออี": "ยูเออี", "ดูไบ": "ยูเออี", "dubai": "ยูเออี", "united arab emirates": "ยูเออี",
      "กาตาร์": "กาตาร์", "qatar": "กาตาร์",
      "คูเวต": "คูเวต", "kuwait": "คูเวต",
      "อิสราเอล": "อิสราเอล", "israel": "อิสราเอล",
      "ตุรกี": "ตุรกี", "ตุรเคีย": "ตุรกี", "turkey": "ตุรกี", "turkiye": "ตุรกี",
      "ซีเรีย": "ซีเรีย", "syria": "ซีเรีย",
      "จอร์แดน": "จอร์แดน", "jordan": "จอร์แดน",
      "เลบานอน": "เลบานอน", "lebanon": "เลบานอน",
      "โอมาน": "โอมาน", "oman": "โอมาน",

      // 4. ทวีปยุโรปและรัสเซีย
      "สหราชอาณาจักร": "สหราชอาณาจักร", "อังกฤษ": "สหราชอาณาจักร", "uk": "สหราชอาณาจักร", "england": "สหราชอาณาจักร", "britain": "สหราชอาณาจักร", "united kingdom": "สหราชอาณาจักร", "british": "สหราชอาณาจักร",
      "รัสเซีย": "รัสเซีย", "russia": "รัสเซีย", "russian": "รัสเซีย",
      "ฝรั่งเศส": "ฝรั่งเศส", "france": "ฝรั่งเศส", "french": "ฝรั่งเศส",
      "เยอรมนี": "เยอรมนี", "เยอรมัน": "เยอรมนี", "เยอรมันนี": "เยอรมนี", "germany": "เยอรมนี", "german": "เยอรมนี",
      "อิตาลี": "อิตาลี", "italy": "อิตาลี", "italian": "อิตาลี",
      "สเปน": "สเปน", "spain": "สเปน", "spanish": "สเปน",
      "โปรตุเกส": "โปรตุเกส", "portugal": "โปรตุเกส",
      "เนเธอร์แลนด์": "เนเธอร์แลนด์", "ฮอลแลนด์": "เนเธอร์แลนด์", "netherlands": "เนเธอร์แลนด์", "holland": "เนเธอร์แลนด์", "dutch": "เนเธอร์แลนด์",
      "สวิตเซอร์แลนด์": "สวิตเซอร์แลนด์", "สวิส": "สวิตเซอร์แลนด์", "switzerland": "สวิตเซอร์แลนด์", "swiss": "สวิตเซอร์แลนด์",
      "สวีเดน": "สวีเดน", "sweden": "สวีเดน", "swedish": "สวีเดน",
      "เดนมาร์ก": "เดนมาร์ก", "denmark": "เดนมาร์ก",
      "นอร์เวย์": "นอร์เวย์", "norway": "นอร์เวย์",
      "ฟินแลนด์": "ฟินแลนด์", "finland": "ฟินแลนด์",
      "ยูเครน": "ยูเครน", "ukraine": "ยูเครน",
      "โปแลนด์": "โปแลนด์", "poland": "โปแลนด์",
      "ออสเตรีย": "ออสเตรีย", "austria": "ออสเตรีย",
      "เช็ก": "เช็ก", "czech": "เช็ก", "czechia": "เช็ก",
      "เบลเยียม": "เบลเยียม", "belgium": "เบลเยียม",
      "กรีซ": "กรีซ", "greece": "กรีซ", "greek": "กรีซ",
      "ไอร์แลนด์": "ไอร์แลนด์", "ireland": "ไอร์แลนด์",
      "โรมาเนีย": "โรมาเนีย", "romania": "โรมาเนีย",
      "ฮังการี": "ฮังการี", "hungary": "ฮังการี",
      
      // 5. ทวีปอเมริกาเหนือและใต้
      "สหรัฐอเมริกา": "สหรัฐอเมริกา", "อเมริกา": "สหรัฐอเมริกา", "usa": "สหรัฐอเมริกา", "us": "สหรัฐอเมริกา", "america": "สหรัฐอเมริกา", "สหรัฐ": "สหรัฐอเมริกา", "อเมริกัน": "สหรัฐอเมริกา", "united states": "สหรัฐอเมริกา", "american": "สหรัฐอเมริกา",
      "แคนาดา": "แคนาดา", "canada": "แคนาดา", "canadian": "แคนาดา",
      "เม็กซิโก": "เม็กซิโก", "mexico": "เม็กซิโก",
      "บราซิล": "บราซิล", "brazil": "บราซิล",
      "อาร์เจนตินา": "อาร์เจนตินา", "argentina": "อาร์เจนตินา",
      "ชิลี": "ชิลี", "chile": "ชิลี",
      "โคลอมเบีย": "โคลอมเบีย", "colombia": "โคลอมเบีย",
      "เปรู": "เปรู", "peru": "เปรู",
      "คิวบา": "คิวบา", "cuba": "คิวบา",
      "เวเนซุเอลา": "เวเนซุเอลา", "venezuela": "เวเนซุเอลา",

      // 6. ทวีปโอเชียเนีย
      "ออสเตรเลีย": "ออสเตรเลีย", "australia": "ออสเตรเลีย", "aus": "ออสเตรเลีย", "australian": "ออสเตรเลีย",
      "นิวซีแลนด์": "นิวซีแลนด์", "new zealand": "นิวซีแลนด์", "nz": "นิวซีแลนด์",
      "ฟิจิ": "ฟิจิ", "fiji": "ฟิจิ",
      "ปาปัวนิวกินี": "ปาปัวนิวกินี", "papua new guinea": "ปาปัวนิวกินี",

      // 7. ทวีปแอฟริกา
      "แอฟริกาใต้": "แอฟริกาใต้", "south africa": "แอฟริกาใต้", "za": "แอฟริกาใต้",
      "อียิปต์": "อียิปต์", "egypt": "อียิปต์",
      "ไนจีเรีย": "ไนจีเรีย", "nigeria": "ไนจีเรีย",
      "เคนยา": "เคนยา", "kenya": "เคนยา",
      "โมร็อกโก": "โมร็อกโก", "morocco": "โมร็อกโก",
      "กานา": "กานา", "ghana": "กานา",
      "เอธิโอเปีย": "เอธิโอเปีย", "ethiopia": "เอธิโอเปีย",
      "ซูดาน": "ซูดาน", "sudan": "ซูดาน",
      "อัลจีเรีย": "อัลจีเรีย", "algeria": "อัลจีเรีย"
  };

  // ตรวจสอบว่าตรงกับประเทศใน Map ด้านบนหรือไม่
  if (countryMap[nat]) {
      return countryMap[nat];
  }

  // ✨ Fallback Strategy (ถ้าใส่ประเทศแปลกๆ ที่ไม่มีในลิสต์มา)
  // หากเป็นภาษาอังกฤษล้วน (เช่น พิมพ์มาว่า "madagascar" หรือ "zambia") ให้ทำเป็น Title Case (Madagascar, Zambia)
  if (/^[a-zA-Z\s]+$/.test(nat)) {
       return nat.replace(/\b\w/g, c => c.toUpperCase());
  }

  // หากเป็นภาษาไทยแปลกๆ หรือสะกดมาไม่เหมือนชาวบ้าน จะถูกตัดคำว่า "ประเทศ" หรือ "สัญชาติ" ทิ้ง และใช้คำที่ผู้ใช้กรอกมาตรงๆ
  return String(rawNat).replace(/^(ประเทศ|ชาว|สัญชาติ|คน)\s*/g, '').trim();
};

// ================= คอนโทรลเลอร์ (Controllers) หลัก =================

exports.getAllData = async (req, res) => {
  try {
    const [illegals, deporteds] = await Promise.all([
      prisma.illegal_immigrants.findMany({ orderBy: { detected_date: "desc" } }),
      prisma.deported_persons.findMany({ orderBy: { return_date: "desc" } })
    ]);
    res.status(200).json({ success: true, data: { illegals, deporteds } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// -------- แอบเข้าเมือง (Illegal) --------

exports.createIllegal = async (req, res) => {
  try {
    const data = req.body;

    if (!data.first_name_th || !data.last_name_th) {
      return res.status(400).json({ 
        success: false, 
        message: "กรุณาระบุชื่อและนามสกุลภาษาไทย (first_name_th, last_name_th)" 
      });
    }

    let photo_url = null;
    if (req.file) {
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const result = await prisma.illegal_immigrants.create({
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        passport_id: data.passport_id || null,
        gender: data.gender || null,
        nationality: data.nationality ? normalizeNationality(data.nationality) : null,
        detected_location: data.detected_location || "ไม่ระบุ",
        workplace: data.workplace || null,
        warrant: data.warrant || null,
        screening_details: data.screening_details || null,
        is_victim: data.is_victim === "true" || data.is_victim === true || false,
        detected_date: data.detected_date ? new Date(data.detected_date) : null,
        photo_url: photo_url
      }
    });
    res.status(201).json({ success: true, data: result, message: "บันทึกข้อมูลแอบเข้าสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.updateIllegal = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingData = await prisma.illegal_immigrants.findUnique({ where: { id: id } });
    if (!existingData) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
    }

    let photo_url = existingData.photo_url;

    if (req.file) {
      // ลบรูปเก่าจาก Drive ถ้ามี
      if (existingData.photo_url) {
        const oldFileId = extractDriveFileId(existingData.photo_url);
        if (oldFileId) {
          try {
            await deleteFromDrive(oldFileId);
          } catch (delErr) {
            console.error("Failed to delete old photo:", delErr.message);
          }
        }
      }
      // อัปโหลดรูปใหม่
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const result = await prisma.illegal_immigrants.update({
      where: { id: id },
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        passport_id: data.passport_id || null,
        gender: data.gender || null,
        nationality: data.nationality ? normalizeNationality(data.nationality) : null,
        detected_location: data.detected_location || "ไม่ระบุ",
        workplace: data.workplace || null,
        warrant: data.warrant || null,
        screening_details: data.screening_details || null,
        is_victim: data.is_victim === "true" || data.is_victim === true || false,
        detected_date: data.detected_date ? new Date(data.detected_date) : null,
        photo_url: photo_url
      }
    });
    res.status(200).json({ success: true, data: result, message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.deleteIllegal = async (req, res) => {
  try {
    const { id } = req.params;
    const existingData = await prisma.illegal_immigrants.findUnique({ where: { id: id } });
    
    if (existingData && existingData.photo_url) {
       const fileId = extractDriveFileId(existingData.photo_url);
       if(fileId) {
          try { await deleteFromDrive(fileId); } catch(e) { console.error(e); }
       }
    }

    await prisma.illegal_immigrants.delete({
      where: { id: id }
    });
    res.status(200).json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

// -------- ส่งกลับ (Deported) --------

exports.createDeported = async (req, res) => {
  try {
    const data = req.body;

    if (!data.first_name_th || !data.last_name_th || !data.date_of_birth || !data.national_id) {
      return res.status(400).json({ 
        success: false, 
        message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" 
      });
    }

    if (data.national_id) {
      const existingNational = await prisma.deported_persons.findUnique({ where: { national_id: data.national_id } });
      if (existingNational) return res.status(400).json({ success: false, message: "เลขประจำตัว (national_id) นี้มีอยู่ในระบบแล้ว" });
    }

    if (data.passport_id) {
      const existingPassport = await prisma.deported_persons.findUnique({ where: { passport_id: data.passport_id } });
      if (existingPassport) return res.status(400).json({ success: false, message: "เลขหนังสือเดินทาง (passport_id) นี้มีอยู่ในระบบแล้ว" });
    }

    let photo_url = null;
    if (req.file) {
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const result = await prisma.deported_persons.create({
      data: {
        first_name_th: data.first_name_th,
        middle_name_th: data.middle_name_th || null,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || null,
        middle_name_en: data.middle_name_en || null,
        last_name_en: data.last_name_en || null,
        date_of_birth: data.date_of_birth, // schema กำหนดเป็น String
        national_id: data.national_id,
        passport_id: data.passport_id || null,
        gender: data.gender || null, // เพิ่ม gender
        address: data.address || "ไม่ระบุ",
        channel: data.channel || null,
        result: data.result || "PENDING",
        number_of_case: parseInt(data.number_of_case) || 0,
        number_of_warrant: parseInt(data.number_of_warrant) || 0,
        age: parseInt(data.age) || null,
        return_date: data.return_date ? new Date(data.return_date) : null,
        photo_url: photo_url,
      }
    });
    res.status(201).json({ success: true, data: result, message: "บันทึกข้อมูลส่งกลับสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.updateDeported = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingData = await prisma.deported_persons.findUnique({ where: { id: id } });
    if (!existingData) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
    }

    let photo_url = existingData.photo_url;

    if (req.file) {
      // ลบรูปเก่าจาก Drive ถ้ามี
      if (existingData.photo_url) {
        const oldFileId = extractDriveFileId(existingData.photo_url);
        if (oldFileId) {
          try {
            await deleteFromDrive(oldFileId);
          } catch (delErr) {
            console.error("Failed to delete old photo:", delErr.message);
          }
        }
      }
      // อัปโหลดรูปใหม่
      const driveRes = await uploadToDrive(req.file, process.env.GOOGLE_DRIVE_FOLDER_ID);
      photo_url = driveRes.webViewLink;
    }

    const updateData = {
      first_name_th: data.first_name_th,
      middle_name_th: data.middle_name_th || null,
      last_name_th: data.last_name_th,
      first_name_en: data.first_name_en || null,
      middle_name_en: data.middle_name_en || null,
      last_name_en: data.last_name_en || null,
      date_of_birth: data.date_of_birth,
      national_id: data.national_id,
      passport_id: data.passport_id || null,
      gender: data.gender || null, // เพิ่มอัปเดต gender
      address: data.address || "ไม่ระบุ",
      channel: data.channel || null,
      result: data.result || "PENDING",
      number_of_case: parseInt(data.number_of_case) || 0,
      number_of_warrant: parseInt(data.number_of_warrant) || 0,
      age: parseInt(data.age) || null,
      return_date: data.return_date ? new Date(data.return_date) : null,
      photo_url: photo_url
    };

    const result = await prisma.deported_persons.update({
      where: { id: id },
      data: updateData
    });
    res.status(200).json({ success: true, data: result, message: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.deleteDeported = async (req, res) => {
  try {
    const { id } = req.params;
    const existingData = await prisma.deported_persons.findUnique({ where: { id: id } });
    
    if (existingData && existingData.photo_url) {
       const fileId = extractDriveFileId(existingData.photo_url);
       if(fileId) {
          try { await deleteFromDrive(fileId); } catch(e) { console.error(e); }
       }
    }

    await prisma.deported_persons.delete({
      where: { id: id }
    });
    res.status(200).json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};


// ================= อัปโหลด Excel (Upload Excel) =================

if (!global.uploadProgress) {
  global.uploadProgress = {};
}

exports.getUploadProgress = (req, res) => {
  const jobId = req.params.jobId;
  const progress = global.uploadProgress[jobId] || { current: 0, total: 0, status: 'pending' };
  res.json(progress);
};

exports.uploadExcelIllegal = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "กรุณาอัปโหลดไฟล์ Excel" });

    const action = req.query.action || "upload";
    const jobId = req.query.jobId;

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    let allJsonData = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
      if (sheetData.length > 0) {
        allJsonData.push(...sheetData.map(row => ({ ...row, _sheetName: sheetName })));
      }
    });

    // ✨✨ กรองข้อมูล: ตัดบรรทัดที่ไม่มีชื่อ (บรรทัดว่าง) ทิ้งไปเลยตั้งแต่แรก ✨✨
    allJsonData = allJsonData.filter(row => {
        const rawFullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
        const { hasName } = processName(rawFullName);
        return hasName;
    });

    if (allJsonData.length === 0) return res.status(400).json({ success: false, message: "ไม่พบข้อมูลในไฟล์ Excel หรือไม่มีรายชื่อให้บันทึก (ระวังบรรทัดว่าง)" });

    if (action === "preview") {
      const preview_data = [];
      for (let i = 0; i < allJsonData.length; i++) {
        const row = allJsonData[i];
        const rawFullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
        const { prefix, fname, mname, lname, isThai, hasName } = processName(rawFullName);
        const { isVictim, details } = processVictimStatus(row);
        
        let dateObj = parseThaiDateToDate(row._sheetName);

        preview_data.push({
          ลำดับที่อ่านได้: i + 1,
          first_name_th: hasName && isThai && fname ? fname : "ไม่ระบุ",
          middle_name_th: isThai ? mname : null,
          last_name_th: hasName && isThai && lname ? lname : "ไม่ระบุ",
          first_name_en: hasName && !isThai ? fname || null : null,
          middle_name_en: !isThai ? mname : null,
          last_name_en: hasName && !isThai ? lname || null : null,
          nationality: findValue(row, "สัญชาติ") ? normalizeNationality(findValue(row, "สัญชาติ")) : null, 
          passport_id: findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport") ? String(findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport")) : null,
          detected_location: findValue(row, "สถานที่ตรวจพบ") ? String(findValue(row, "สถานที่ตรวจพบ")) : "ไม่ระบุ",
          workplace: findValue(row, "สถานที่ทำงาน") ? String(findValue(row, "สถานที่ทำงาน")) : null,
          warrant: findValue(row, "หมายจับ") ? String(findValue(row, "หมายจับ")) : null,
          gender: determineGender(row, prefix),
          detected_date: dateObj ? dateObj.toISOString().split('T')[0] : null,
          is_victim: isVictim,
          screening_details: details,
          raw_data_from_excel: row
        });
      }
      return res.status(200).json({ success: true, message: "ดึงข้อมูลพรีวิวสำเร็จ (ยังไม่ได้บันทึก)", total_rows: preview_data.length, preview_data });
    }

    if (jobId) {
       global.uploadProgress[jobId] = { current: 0, total: allJsonData.length, status: 'processing' };
    }

    let successCount = 0;
    let errors = [];

    for (let i = 0; i < allJsonData.length; i++) {
      const row = allJsonData[i];
      const rawFullName = findValue(row, "ชื่อสกุล") || findValue(row, "ชื่อ") || "";
      const { prefix, fname, mname, lname, isThai, hasName } = processName(rawFullName);
      const { isVictim, details } = processVictimStatus(row);

      try {
         await prisma.illegal_immigrants.create({
            data: {
                first_name_th: hasName && isThai && fname ? fname : "ไม่ระบุ",
                middle_name_th: isThai ? mname : null,
                last_name_th: hasName && isThai && lname ? lname : "ไม่ระบุ",
                first_name_en: hasName && !isThai ? fname || null : null,
                middle_name_en: !isThai ? mname : null,
                last_name_en: hasName && !isThai ? lname || null : null,
                nationality: findValue(row, "สัญชาติ") ? normalizeNationality(findValue(row, "สัญชาติ")) : null, 
                passport_id: findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport") ? String(findValue(row, "เลขหนังสือเดินทาง") || findValue(row, "Passport")) : null,
                detected_location: findValue(row, "สถานที่ตรวจพบ") ? String(findValue(row, "สถานที่ตรวจพบ")) : "ไม่ระบุ",
                workplace: findValue(row, "สถานที่ทำงาน") ? String(findValue(row, "สถานที่ทำงาน")) : null,
                warrant: findValue(row, "หมายจับ") ? String(findValue(row, "หมายจับ")) : null,
                gender: determineGender(row, prefix),
                detected_date: parseThaiDateToDate(row._sheetName),
                is_victim: isVictim,
                screening_details: details,
            }
         });
         successCount++;
      } catch (dbErr) {
         errors.push(`แถวที่ ${i+1}: ${dbErr.message}`);
      }

      if (jobId && global.uploadProgress[jobId]) {
         global.uploadProgress[jobId].current = i + 1;
      }
    }

    if (jobId && global.uploadProgress[jobId]) global.uploadProgress[jobId].status = 'completed';

    res.status(200).json({ 
        success: true, 
        message: `บันทึกข้อมูลแอบเข้าสำเร็จ ${successCount} จาก ${allJsonData.length} รายการ`,
        errors: errors.length > 0 ? errors : undefined 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการอ่านไฟล์และบันทึกข้อมูล" });
  }
};