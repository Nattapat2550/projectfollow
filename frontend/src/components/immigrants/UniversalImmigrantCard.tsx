import React, { createContext, useContext, useState, useEffect } from "react";

interface UniversalImmigrantCardProps {
  data: any;
  type: "illegal" | "repatriated"; // อิงตามประเภทข้อมูลจาก API / Backend
  isExporting?: boolean;
}

const ExportContext = createContext<boolean>(false);

// ----------------------------------------------------------------------
// ฟังก์ชันจัดการข้อมูลและรูปภาพ
// ----------------------------------------------------------------------
const getDirectImageUrl = (url: string, uniqueId?: string) => {
  if (!url) return "";
  let driveId = "";
  
  const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    driveId = matchFileD[1];
  } else {
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchId && matchId[1]) {
      driveId = matchId[1];
    }
  }

  if (driveId) {
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
    let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(thumbnailUrl)}`;
    if (uniqueId) proxyUrl += `&_id=${uniqueId}`;
    return proxyUrl;
  }
  
  // For other external URLs, proxy them as well if they might have CORS issues
  if (url.startsWith("http")) {
    let proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
    if (uniqueId) proxyUrl += `&_id=${uniqueId}`;
    return proxyUrl;
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
const Base64Image = ({ src, alt, className, crossOrigin, referrerPolicy }: any) => {
  const [base64, setBase64] = useState<string>(src);
  
  useEffect(() => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) {
      setBase64(src);
      return;
    }
    let isMounted = true;
    fetch(src)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted && reader.result) {
            setBase64(reader.result as string);
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error("Failed to load image as base64", err);
      });
      
    return () => { isMounted = false; };
  }, [src]);

  return <img src={base64} alt={alt} className={className} crossOrigin={crossOrigin} referrerPolicy={referrerPolicy} />;
};

export default function UniversalImmigrantCard({ data, type, isExporting = false }: UniversalImmigrantCardProps) {
  if (!data) return null;

  const isIllegal = type === "illegal";
  const flagUrl = getFlagUrl(data.nationality);

  // แยกชื่อ ไทย-อังกฤษ
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
      return parts.join(" | ") || "-";
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
      return parts.join(" ") || "-";
    }
  };

  // ตรวจสอบสถานะผู้เสียหาย (ไม่มี Emoji)
  let victimStatusStr = "ไม่คัดกรองสถานะ";
  let victimColorClass = "text-[#a16207] bg-[#fef9c3] border-[#facc15]";

  if (data.is_victim === "YES" || data.is_victim === true || data.is_victim === "true") {
    victimStatusStr = "เป็นผู้เสียหาย";
    victimColorClass = "text-[#b91c1c] bg-[#fee2e2] border-[#f87171]";
  } else if (data.is_victim === "NO" || data.is_victim === false || data.is_victim === "false") {
    victimStatusStr = "ไม่เป็นผู้เสียหาย";
    victimColorClass = "text-[#15803d] bg-[#dcfce7] border-[#4ade80]";
  }

  return (
    <ExportContext.Provider value={isExporting}>
      <div className="relative w-full bg-[#DFF5EC] rounded-2xl border border-[#9DD8BE] shadow-md overflow-hidden font-sans pt-[6%]" style={{ aspectRatio: "856 / 540" }}>
        
        {/* Header ตรงกลางด้านบน */}
        <div className="absolute top-[3%] left-0 w-full text-center">
          <p className="font-bold text-[#022c22] tracking-wide" style={{ fontSize: isExporting ? "24px" : "clamp(12px, 2.8vw, 24px)" }}>
            {isIllegal ? "ผู้ลักลอบเข้าประเทศ" : "ผู้ถูกส่งตัวกลับ"}
          </p>
        </div>

      <div className="absolute inset-0 top-[11%] flex p-[4%] pt-0">
        
        {/* คอลัมน์ซ้าย (รายละเอียดข้อมูล) */}
        <div className="flex flex-col min-w-0" style={{ width: "67%", marginRight: "3%" }}>
          
          {/* แถว 1: ชื่อ-นามสกุล (แยกกล่อง ไทย - อังกฤษ) */}
          <div className="flex justify-between w-full" style={{ marginBottom: "2%" }}>
            <div className="flex flex-col" style={{ width: "48.5%" }}>
              <ILabel>ชื่อ - นามสกุล</ILabel>
              <IBox>{fullNameTh || "-"}</IBox>
            </div>
            <div className="flex flex-col" style={{ width: "48.5%" }}>
              <ILabel>Name</ILabel>
              <IBox>{fullNameEn || "-"}</IBox>
            </div>
          </div>

          {/* แถว 2: เลขที่บัตร */}
          <div className="flex justify-between w-full" style={{ marginBottom: "2%" }}>
            <div className="flex flex-col" style={{ width: "48.5%" }}>
              <ILabel>เลขประจำตัวประชาชน</ILabel>
              <IBox mono>{formatNationalId(data.national_id) || "-"}</IBox>
            </div>
            <div className="flex flex-col" style={{ width: "48.5%" }}>
              <ILabel>เลขที่หนังสือเดินทาง (Passport ID)</ILabel>
              <IBox mono>{data.passport_id || "-"}</IBox>
            </div>
          </div>

          {/* แถว 3: วันเกิด / เพศ-อายุ / สัญชาติ */}
          <div className="flex w-full" style={{ marginBottom: "2%" }}>
            <div className="flex flex-col" style={{ width: "37.6%", marginRight: "3%" }}>
              <ILabel>วันเดือนปีเกิด / DOB</ILabel>
              <IBox>{getDobText()}</IBox>
            </div>
            <div className="flex flex-col" style={{ width: "25.1%", marginRight: "3%" }}>
              <ILabel>เพศ/อายุ</ILabel>
              <IBox>{data.gender || "-"}{data.age ? ` (${data.age})` : ""}</IBox>
            </div>
            <div className="flex flex-col" style={{ width: "31.3%" }}>
              <ILabel>สัญชาติ</ILabel>
              <IBox>
                <div className="flex items-center gap-1.5">
                  {flagUrl && <img src={flagUrl} alt="flag" crossOrigin="anonymous" className="w-4.5 h-3.25 object-cover rounded-xs shadow-sm" />}
                  <span className="truncate">{data.nationality || "-"}</span>
                </div>
              </IBox>
            </div>
          </div>

          {/* แถว 4: สถานที่ */}
          <div className="flex flex-col" style={{ marginBottom: "2%" }}>
            <ILabel>{isIllegal ? "สถานที่ทำงาน / จุดตรวจพบ" : "ที่อยู่ปัจจุบันตามบันทึก"}</ILabel>
            <IBox noTruncate className="w-full justify-start! text-left">
              <div className="truncate w-full">{getLocationText()}</div>
            </IBox>
          </div>

          {/* แถว 5: ข้อมูลอื่นๆ ทั้งหมดจาก Structure.md */}
          <div className="flex flex-col flex-1 mb-1">
            <ILabel>ข้อมูลเพิ่มเติม (Additional Info)</ILabel>
            <IBox noTruncate className="h-full justify-start! text-left overflow-hidden">
              {isIllegal ? (
                // เปลี่ยนเป็น flex-col จัดเรียงบรรทัดละหัวข้อ และใช้ break-words เพื่อให้ขึ้นบรรทัดใหม่เมื่อข้อความยาว
                <div className="flex flex-col gap-y-1.5 w-full" style={{ fontSize: "0.95em" }}>
                  <div className="wrap-break-word"><span className="font-semibold text-[#022c22]">รายละเอียดคัดกรอง:</span> {data.screening_details || "-"}</div>
                  <div className="wrap-break-wordword"><span className="font-semibold text-[#022c22]">หมายเหตุ:</span> {data.note || "-"}</div>
                </div>
              ) : (
                // เปลี่ยนเป็น flex-col เช่นเดียวกัน
                <div className="flex flex-col gap-y-1.5 w-full" style={{ fontSize: "0.85em" }}>
                  <div className="wrap-break-word"><span className="font-semibold text-[#022c22]">อาชีพ:</span> {data.job_type || "-"}{data.role ? ` (${data.role})` : ""}</div>
                  <div className="wrap-break-wordword"><span className="font-semibold text-[#022c22]">รายได้/เดือน:</span> {data.salary || "-"}</div>
                  <div className="wrap-break-word"><span className="font-semibold text-[#022c22]">ผู้จ่ายเงิน:</span> {data.paid_by || "-"}{data.payment_method ? ` (${data.payment_method})` : ""}</div>
                  <div className="wrap-break-wordword"><span className="font-semibold text-[#022c22]">คดี/หมายจับ:</span> {data.number_of_case || "0"} / {data.number_of_warrant || "0"}</div>
                  <div className="wrap-break-word"><span className="font-semibold text-[#022c22]">หน่วยงาน:</span> {data.responsible_agency || "-"}</div>
                  {(data.is_victim === true || data.is_victim === false || data.is_victim === "YES" || data.is_victim === "NO" || data.is_victim === "true" || data.is_victim === "false") && (
                    <div className="wrap-break-wordword">
                      <span className="font-semibold text-[#022c22]">สถานะผู้เสียหาย:</span> {
                        (data.is_victim === true || data.is_victim === "YES" || data.is_victim === "true") ? "เป็นผู้เสียหาย" : "ไม่เป็นผู้เสียหาย"
                      }
                    </div>
                  )}
                  <div className="wrap-break-word"><span className="font-semibold text-[#022c22]">รายละเอียดคัดกรอง:</span> {data.screening_details || "-"}</div>
                  <div className="wrap-break-wordword"><span className="font-semibold text-[#022c22]">ช่องทาง:</span> {data.channel || "-"}</div>
                  <div className="wrap-break-word"><span className="font-semibold text-[#022c22]">หมายเหตุ:</span> {data.note || "-"}</div>
                </div>
              )}
            </IBox>
          </div>

        </div>

        {/* คอลัมน์ขวา (รูปภาพ ไว้ฝั่งขวา) */}
        <div className="flex flex-col items-center shrink-0" style={{ width: "30%" }}>
          <div className="bg-white border border-[#a7f3d0] rounded-xl flex items-end justify-center overflow-hidden shadow-inner relative w-full mb-[5%]" style={{ aspectRatio: "3/4" }}>
            {data.photo_url || data.image_url ? (
               <Base64Image 
                 src={getDirectImageUrl(data.photo_url || data.image_url, data.id || Math.random().toString())} 
                 alt="Profile" 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer"
                 crossOrigin="anonymous"
               />
            ) : (
               <div className="flex flex-col items-center justify-end w-full h-full pb-[8%]">
                 <img src={"/enter.png"} className="opacity-40 w-1/2" alt="Placeholder"></img>
               </div>
            )}
          </div>

          {/* ป้ายสถานะผู้เสียหาย (ไม่มี Emoji) */}
          <span className={`w-full text-center ${victimColorClass} font-bold border rounded-full px-2 py-1 mb-[5%] flex items-center justify-center`} style={{ fontSize: isExporting ? "11px" : "clamp(8px, 1.1vw, 12px)" }}>
            <span>{victimStatusStr}</span>
          </span>

          {/* วันที่พบตัว (โชว์เด่นๆ ฝั่งขวาใต้รูป) */}
          <div className="w-full flex flex-col items-center">
            <div style={{ marginBottom: "4px" }}><ILabel>{isIllegal ? "วันที่พบตัว" : "วันที่ส่งตัวกลับ"}</ILabel></div>
            <IBox className="w-full flex justify-center text-center font-bold">{dateValue}</IBox>
          </div>
        </div>

      </div>
    </div>
  </ExportContext.Provider>
  );
}

// ----------------------------------------------------------------------
// Styled Components ภายใน
// ----------------------------------------------------------------------
function ILabel({ children, className = "" }: { children: React.ReactNode; className?: string; }) {
  const isExporting = useContext(ExportContext);
  return <span className={`font-bold text-[#022c22] block mb-0.5 ${className}`} style={{ fontSize: isExporting ? "10px" : "clamp(5px, 1.2vw, 11px)" }}>{children}</span>;
}

function IBox({ children, mono = false, noTruncate = false, className = "" }: { children: React.ReactNode; mono?: boolean; noTruncate?: boolean; className?: string; }) {
  const isExporting = useContext(ExportContext);
  return (
    <div className={`bg-[#B8E8D4] rounded-md text-[#064e3b] font-medium ${mono ? "font-mono tracking-tight" : ""} ${noTruncate ? "flex flex-col justify-center" : "truncate"} ${className}`} style={{ fontSize: isExporting ? "11px" : "clamp(6px, 1.3vw, 12px)", padding: isExporting ? "6px 10px" : "0.5em 0.8em" }}>
      {children}
    </div>
  );
}