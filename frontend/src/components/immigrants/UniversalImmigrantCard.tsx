import React from "react";

interface UniversalImmigrantCardProps {
  data: any;
  type: "illegal" | "repatriated"; // อิงตามประเภทข้อมูลจาก API / Backend
}

// ----------------------------------------------------------------------
// ฟังก์ชันจัดการข้อมูลและรูปภาพ
// ----------------------------------------------------------------------
const getDirectImageUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("drive.google.com/file/d/")) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
    }
  }
  return url;
};

const formatNationalId = (id: string): string => {
  if (!id || id.trim().length !== 13) return id || "-";
  return id.replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, "$1-$2-$3-$4-$5");
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "-"
      : date.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "-";
  }
};

// ----------------------------------------------------------------------
// ฐานข้อมูลสัญชาติ - รหัสประเทศ
// ----------------------------------------------------------------------
const COUNTRY_MAP: { [key: string]: string } = {
  "ไทย": "th", "thai": "th", "thailand": "th",
  "พม่า": "mm", "เมียนมา": "mm", "myanmar": "mm", "burma": "mm",
  "ลาว": "la", "laos": "la", "lao": "la",
  "กัมพูชา": "kh", "เขมร": "kh", "cambodia": "kh",
  "เวียดนาม": "vn", "vietnam": "vn",
  "มาเลเซีย": "my", "malaysia": "my",
  "สิงคโปร์": "sg", "singapore": "sg",
  "อินโดนีเซีย": "id", "indonesia": "id",
  "ฟิลิปปินส์": "ph", "philippines": "ph",
  "บรูไน": "bn", "brunei": "bn",
  "ติมอร์": "tl", "timor": "tl",
  "จีน": "cn", "china": "cn",
  "ไต้หวัน": "tw", "taiwan": "tw",
  "ญี่ปุ่น": "jp", "japan": "jp",
  "เกาหลีใต้": "kr", "south korea": "kr", "korea": "kr",
  "เกาหลีเหนือ": "kp", "north korea": "kp",
  "ฮ่องกง": "hk", "hong kong": "hk",
  "มาเก๊า": "mo", "macau": "mo",
  "อินเดีย": "in", "india": "in",
  "บังกลาเทศ": "bd", "bangladesh": "bd",
  "ปากีสถาน": "pk", "pakistan": "pk",
  "ศรีลังกา": "lk", "sri lanka": "lk",
  "เนปาล": "np", "nepal": "np",
  "อัฟกานิสถาน": "af", "afghanistan": "af",
  "อังกฤษ": "gb", "สหราชอาณาจักร": "gb", "uk": "gb",
  "สหรัฐอเมริกา": "us", "อเมริกา": "us", "usa": "us",
};

const SORTED_COUNTRY_KEYS = Object.keys(COUNTRY_MAP).sort((a, b) => b.length - a.length);

const getFlagUrl = (nationality: string) => {
  if (!nationality) return null;
  const nat = nationality.trim().toLowerCase();
  const foundKey = SORTED_COUNTRY_KEYS.find((key) => nat.includes(key));
  return foundKey ? `https://flagcdn.com/w40/${COUNTRY_MAP[foundKey]}.png` : null;
};

// ----------------------------------------------------------------------
// Component หลัก
// ----------------------------------------------------------------------
export default function UniversalImmigrantCard({ data, type }: UniversalImmigrantCardProps) {
  if (!data) return null;

  const isIllegal = type === "illegal";
  const flagUrl = getFlagUrl(data.nationality);

  // ชื่อ ไทย-อังกฤษ
  const fullNameTh = `${data.first_name_th || ""}${data.middle_name_th ? " " + data.middle_name_th : ""} ${data.last_name_th || ""}`.trim();
  const fullNameEn = data.first_name_en
    ? `${data.first_name_en}${data.middle_name_en ? " " + data.middle_name_en : ""} ${data.last_name_en ?? ""}`.trim()
    : "";

  // วันที่พบตัว / ส่งกลับ
  const dateValue = formatDate(isIllegal ? data.detected_date : data.return_date);

  // วันเดือนปีเกิด
  const getDobText = () => {
    if (data.date_of_birth) {
      return formatDate(data.date_of_birth);
    }
    // สำหรับ Repatriated Persons ที่อาจเก็บแยกเป็นวันเดือนปี
    if (data.birth_day && data.birth_month && data.birth_year) {
      const thMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const m = thMonths[data.birth_month - 1] || data.birth_month;
      return `${data.birth_day} ${m} ${data.birth_year}`;
    }
    return "-";
  };

  // ข้อมูลสถานที่ / ที่อยู่
  const getLocationText = () => {
    if (isIllegal) {
      const parts = [];
      if (data.workplace) parts.push(`ที่ทำงาน: ${data.workplace}`);
      if (data.detected_location_details) parts.push(data.detected_location_details);
      
      const subParts = [
        data.detected_location_sub_district ? `ต.${data.detected_location_sub_district}` : "",
        data.detected_location_district ? `อ.${data.detected_location_district}` : "",
        data.detected_location_province ? `จ.${data.detected_location_province}` : "",
      ].filter(Boolean).join(" ");
      
      if (subParts) parts.push(subParts);
      return parts.join(" | ") || "ไม่ระบุสถานที่";
    } else {
      const parts = [];
      if (data.address_details) parts.push(data.address_details);
      
      const subParts = [
        data.building ? `อาคาร${data.building}` : "",
        data.floor ? `ชั้น${data.floor}` : "",
        data.room ? `ห้อง${data.room}` : "",
        data.sub_district ? `ต.${data.sub_district}` : "",
        data.district ? `อ.${data.district}` : "",
        data.province ? `จ.${data.province}` : "",
      ].filter(Boolean).join(" ");
      
      if (subParts) parts.push(subParts);
      return parts.join(" ") || "ไม่ระบุที่อยู่";
    }
  };

  // ตรวจสอบสถานะผู้เสียหาย (เขียว / เหลือง / แดง)
  let victimStatusStr = "ไม่คัดกรอง";
  let victimColorClass = "text-yellow-700 bg-yellow-100 border-yellow-400";
  let victimIcon = "❓";

  if (data.is_victim === true) {
    victimStatusStr = "เป็นผู้เสียหาย";
    victimColorClass = "text-red-700 bg-red-100 border-red-400";
    victimIcon = "⚠️";
  } else if (data.is_victim === false) {
    victimStatusStr = "ไม่เป็นผู้เสียหาย";
    victimColorClass = "text-green-700 bg-green-100 border-green-400";
    victimIcon = "✅";
  }

  return (
    <div className="relative w-full bg-[#DFF5EC] rounded-2xl border border-[#9DD8BE] shadow-md overflow-hidden font-sans pt-[6%]" style={{ aspectRatio: "856 / 540" }}>
      
      {/* Header ตรงกลางด้านบน */}
      <div className="absolute top-[3%] left-0 w-full text-center">
        <p className="font-bold text-emerald-950 tracking-wide" style={{ fontSize: "clamp(12px, 2.8vw, 24px)" }}>
          {isIllegal ? "ผู้ลักลอบเข้าประเทศ (ผู้แอบ)" : "ผู้ถูกส่งตัวกลับ"}
        </p>
      </div>

      <div className="absolute inset-0 top-[12%] flex p-[4%] pt-0 gap-[4%]">
        
        {/* คอลัมน์ซ้าย (รายละเอียดข้อมูล - เหมือนบัตรประชาชน) */}
        <div className="flex flex-col flex-1 gap-[3%] min-w-0">
          
          {/* แถว 1: ชื่อ-นามสกุล (แยก ไทย - อังกฤษ) */}
          <div className="flex flex-col gap-[4%]">
            <ILabel>ชื่อ - นามสกุล / Name</ILabel>
            <IBox noTruncate>
              <div className="font-bold truncate text-[1.1em] text-emerald-950">{fullNameTh || "ไม่ระบุชื่อ"}</div>
              <div className="truncate text-[0.85em] opacity-80 mt-[1%] font-medium">{fullNameEn || "-"}</div>
            </IBox>
          </div>

          {/* แถว 2: เลขที่บัตร (อยู่ใต้ชื่อ) */}
          <div className="flex gap-[4%]">
            <div className="flex flex-col gap-[6%] flex-1">
              <ILabel>เลขประจำตัวประชาชน</ILabel>
              <IBox mono>{formatNationalId(data.national_id) || "-"}</IBox>
            </div>
            <div className="flex flex-col gap-[6%] flex-1">
              <ILabel>เลขที่หนังสือเดินทาง</ILabel>
              <IBox mono>{data.passport_id || "-"}</IBox>
            </div>
          </div>

          {/* แถว 3: วันเกิด / เพศ-อายุ / สัญชาติ */}
          <div className="flex gap-[4%]">
            <div className="flex flex-col gap-[6%] flex-[1.2]">
              <ILabel>วันเดือนปีเกิด / DOB</ILabel>
              <IBox>{getDobText()}</IBox>
            </div>
            <div className="flex flex-col gap-[6%] flex-[0.8]">
              <ILabel>เพศ/อายุ</ILabel>
              <IBox>{data.gender || "-"}{data.age ? ` (${data.age})` : ""}</IBox>
            </div>
            <div className="flex flex-col gap-[6%] flex-1">
              <ILabel>สัญชาติ</ILabel>
              <IBox>
                <div className="flex items-center gap-1.5">
                  {flagUrl && <img src={flagUrl} alt="flag" className="w-4.5 h-3.25 object-cover rounded-xs shadow-sm" />}
                  <span className="truncate">{data.nationality || "-"}</span>
                </div>
              </IBox>
            </div>
          </div>

          {/* แถว 4: สถานที่ และ ข้อมูลเพิ่มเติม */}
          <div className="flex flex-col gap-[4%]">
            <ILabel>{isIllegal ? "สถานที่ทำงาน / จุดตรวจพบ" : "ที่อยู่ปัจจุบันตามบันทึก"}</ILabel>
            <IBox noTruncate>
              <div className="truncate">{getLocationText()}</div>
              {!isIllegal && (
                <div className="truncate text-[0.85em] opacity-80 mt-[0.8%] font-medium">
                  ช่องทาง: {data.channel || "-"} | สถานะ: {data.result || "-"} | คดี: {data.number_of_case || 0}
                </div>
              )}
            </IBox>
          </div>

        </div>

        {/* คอลัมน์ขวา (รูปภาพ ไว้ฝั่งขวา) */}
        <div className="flex flex-col items-center shrink-0" style={{ width: "30%" }}>
          <div className="bg-white border border-emerald-200 rounded-xl flex items-end justify-center overflow-hidden shadow-inner relative w-full mb-[5%]" style={{ aspectRatio: "3/4" }}>
            {data.photo_url || data.image_url ? (
               <img 
                 src={getDirectImageUrl(data.photo_url || data.image_url)} 
                 alt="Profile" 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer"
               />
            ) : (
              <div className="flex flex-col items-center justify-end w-full h-full pb-[8%]">
                <img src={"/enter.png"} className="opacity-40 w-1/2" alt="Placeholder"></img>
              </div>
            )}
          </div>

          {/* ป้ายสถานะผู้เสียหาย (แดง / เหลือง / เขียว) */}
          <span className={`w-full text-center ${victimColorClass} font-bold border rounded-full px-2 py-1 mb-[5%] flex items-center justify-center gap-1`} style={{ fontSize: "clamp(8px, 1.2vw, 12px)" }}>
            <span>{victimIcon}</span>
            <span>{victimStatusStr}</span>
          </span>

          {/* วันที่พบตัว (โชว์เด่นๆ ฝั่งขวาใต้รูป) */}
          <div className="w-full flex flex-col items-center gap-[6%]">
            <ILabel>{isIllegal ? "วันที่พบตัว" : "วันที่ส่งตัวกลับ"}</ILabel>
            <IBox className="w-full flex justify-center text-center font-bold">{dateValue}</IBox>
          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Styled Components ภายใน
// ----------------------------------------------------------------------
function ILabel({ children, className = "" }: { children: React.ReactNode; className?: string; }) {
  return <span className={`font-bold text-emerald-950 ${className}`} style={{ fontSize: "clamp(5px, 1.3vw, 11px)" }}>{children}</span>;
}

function IBox({ children, mono = false, noTruncate = false, className = "" }: { children: React.ReactNode; mono?: boolean; noTruncate?: boolean; className?: string; }) {
  return (
    <div className={`bg-[#B8E8D4] rounded-md text-emerald-900 font-medium ${mono ? "font-mono tracking-tight" : ""} ${noTruncate ? "flex flex-col justify-center" : "truncate"} ${className}`} style={{ fontSize: "clamp(6px, 1.5vw, 13px)", padding: "4% 6%", minHeight: "18%" }}>
      {children}
    </div>
  );
}