import React from "react";

interface UniversalImmigrantCardProps {
  data: any;
  type: "illegal" | "repatriated"; // อิงตามประเภทข้อมูลจาก API / Backend
}

// ฟังก์ชันแปลง Thumbnail จาก Google Drive ตามโครงสร้างเดิม
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

// ฟังก์ชันฟอร์แมตเลขประจำตัวประชาชน 13 หลักสไตล์ Apple Mono
const formatNationalId = (id: string): string => {
  if (!id || id.trim().length !== 13) return id || "-";
  return id.replace(/^(\d)(\d{4})(\d{5})(\d{2})(\d)$/, "$1-$2-$3-$4-$5");
};

// ฟังก์ชันฟอร์แมตวันที่จาก Backend (YYYY-MM-DD -> DD/MM/YYYY)
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

export default function UniversalImmigrantCard({ data, type }: UniversalImmigrantCardProps) {
  if (!data) return null;

  const isIllegal = type === "illegal";

  // 1. จัดการการประกอบชื่อภาษาไทยและอังกฤษ (ดึงจากฟิลด์ DB ตรงๆ)
  const fullNameTh = `${data.first_name_th || ""}${data.middle_name_th ? " " + data.middle_name_th : ""} ${data.last_name_th || ""}`.trim() || "-";
  const fullNameEn = data.first_name_en
    ? `${data.first_name_en}${data.middle_name_en ? " " + data.middle_name_en : ""} ${data.last_name_en || ""}`.trim()
    : "-";

  // 2. แยกข้อมูลเลขระบุตัวตนสัญญะตามประเภทบัตร (ตามเงื่อนไขที่มอบหมาย)
  const idLabel = isIllegal ? "PASSPORT ID / เลขหนังสือเดินทาง" : "NATIONAL ID / เลขประจำตัวประชาชน";
  const idValue = isIllegal ? (data.passport_id || "-") : formatNationalId(data.national_id);

  // 3. แยกฟิลด์วันที่ตรวจพบ (Detected) และ วันที่ส่งตัวกลับ (Return) ตามตารางหลังบ้าน
  const dateLabel = isIllegal ? "วันที่ตรวจพบ (Detected Date)" : "วันที่ส่งตัวกลับ (Return Date)";
  const dateValue = formatDate(isIllegal ? data.detected_date : data.return_date);

  // 4. ประกอบฟิลด์ที่อยู่ / สถานที่เกิดเหตุตาม Schema ของแต่ละตาราง
  const getLocationText = () => {
    if (isIllegal) {
      if (data.detected_location_details) return data.detected_location_details;
      const parts = [
        data.detected_location_sub_district ? `ต.${data.detected_location_sub_district}` : "",
        data.detected_location_district ? `อ.${data.detected_location_district}` : "",
        data.detected_location_province ? `จ.${data.detected_location_province}` : "",
      ].filter(Boolean);
      return parts.join(" ") || "-";
    } else {
      if (data.address_details) return data.address_details;
      const parts = [
        data.building ? `อาคาร ${data.building}` : "",
        data.floor ? `ชั้น ${data.floor}` : "",
        data.room ? `ห้อง ${data.room}` : "",
        data.sub_district ? `ต.${data.sub_district}` : "",
        data.district ? `อ.${data.district}` : "",
        data.province ? `จ.${data.province}` : "",
      ].filter(Boolean);
      return parts.join(" ") || "-";
    }
  };

  return (
    <div 
      className="relative w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] text-zinc-950 dark:text-zinc-50 font-sans tracking-tight overflow-hidden select-none"
      style={{ aspectRatio: "856 / 540" }}
    >
      {/* ส่วนหัวของบัตรสไตล์ Apple Card (Top Header Line) */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-zinc-900 dark:bg-zinc-100 opacity-90" />

      <div className="absolute inset-0 flex p-[5%] pt-[6%] gap-[5%]">
        
        {/* คอลัมน์ซ้าย: รูปถ่ายบุคคลแบบมินิมอลพรีเมียม */}
        <div className="flex flex-col items-center shrink-0" style={{ width: "26%" }}>
          <div className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden shadow-inner relative" style={{ aspectRatio: "3/4" }}>
            {data.photo_url || data.image_url ? (
              <img 
                src={getDirectImageUrl(data.photo_url || data.image_url)} 
                alt="Identity Document Profile" 
                className="w-full h-full object-cover transition-opacity duration-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
                <svg className="w-12 h-12 stroke-current fill-none stroke-1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
          </div>
          
          {/* ข้อมูลเหยื่อจากการค้ามนุษย์ (ถ้ามีสัญญะระบุไว้) */}
          {data.is_victim && (
            <div className="mt-[10%] px-2.5 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-600 text-center font-medium tracking-wide whitespace-nowrap" style={{ fontSize: "clamp(6px, 1.1vw, 10px)" }}>
              TRAFFICKING VICTIM
            </div>
          )}
        </div>

        {/* คอลัมน์ขวา: การจัดวางกริดข้อมูลสไตล์สะอาดตา เรียงลื่นไหล */}
        <div className="flex flex-col flex-1 min-w-0 justify-between">
          
          {/* ส่วนบน: ระบุประเภทผู้อพยพ และเลขประจำตัวที่ทำหน้าตาเหมือนกัน */}
          <div className="flex justify-between items-start w-full border-b border-zinc-100 dark:border-zinc-800 pb-[3%]">
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 font-medium tracking-widest block uppercase mb-0.5" style={{ fontSize: "clamp(6px, 1.2vw, 10px)" }}>
                Immigrant Classification
              </span>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight" style={{ fontSize: "clamp(12px, 2.4vw, 20px)" }}>
                {isIllegal ? "ผู้ลักลอบเข้าประเทศ" : "ผู้ถูกส่งตัวกลับ"}
              </h2>
            </div>
            
            {/* กล่องรหัสสำคัญหลักที่ทำให้ออกมาเหมือนกันทั้ง 2 บัตร */}
            <div className="text-right">
              <span className="text-zinc-400 dark:text-zinc-500 font-medium tracking-tight block mb-1" style={{ fontSize: "clamp(6px, 1.1vw, 10px)" }}>
                {idLabel}
              </span>
              <div className="font-mono font-medium text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-700/60 rounded-md px-2.5 py-1 inline-block" style={{ fontSize: "clamp(9px, 1.8vw, 14px)" }}>
                {idValue}
              </div>
            </div>
          </div>

          {/* ส่วนกลาง: ข้อมูลส่วนตัวหลัก (Personal Details) */}
          <div className="grid grid-cols-1 gap-[3%] my-[2%]">
            {/* ชื่อภาษาไทย */}
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 font-medium block" style={{ fontSize: "clamp(5px, 1.1vw, 10px)" }}>ชื่อ - นามสกุล / Name</span>
              <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate" style={{ fontSize: "clamp(10px, 1.8vw, 15px)" }}>{fullNameTh}</div>
            </div>
            {/* ชื่อภาษาอังกฤษ */}
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 font-medium block" style={{ fontSize: "clamp(5px, 1.1vw, 10px)" }}>English Name</span>
              <div className="font-normal text-zinc-600 dark:text-zinc-400 font-sans tracking-wide truncate" style={{ fontSize: "clamp(9px, 1.6vw, 13.5px)" }}>{fullNameEn}</div>
            </div>
          </div>

          {/* ส่วนตารางกริดข้อมูลเสริมย่อยเพื่อประหยัดพื้นที่อย่างสมดุล */}
          <div className="grid grid-cols-3 gap-[4%] border-t border-b border-zinc-50 dark:border-zinc-800/60 py-[2.5%]">
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5" style={{ fontSize: "clamp(5px, 1.1vw, 10px)" }}>สัญชาติ (Nationality)</span>
              <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate" style={{ fontSize: "clamp(8px, 1.5vw, 12.5px)" }}>{data.nationality || "-"}</div>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5" style={{ fontSize: "clamp(5px, 1.1vw, 10px)" }}>เพศ (Gender)</span>
              <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate" style={{ fontSize: "clamp(8px, 1.5vw, 12.5px)" }}>{data.gender || "-"}</div>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block mb-0.5" style={{ fontSize: "clamp(5px, 1.1vw, 10px)" }}>อายุ (Age)</span>
              <div className="font-mono font-medium text-zinc-800 dark:text-zinc-200" style={{ fontSize: "clamp(8px, 1.5vw, 12.5px)" }}>{data.age !== null && data.age !== undefined ? `${data.age} ปี` : "-"}</div>
            </div>
          </div>

          {/* ส่วนล่างสุด: วันที่บันทึก และ สถานที่ตรวจพบ/ที่อยู่ปัจจุบัน */}
          <div className="flex gap-[5%] items-start pt-[2%]">
            <div className="shrink-0" style={{ width: "35%" }}>
              <span className="text-zinc-400 dark:text-zinc-500 block" style={{ fontSize: "clamp(5px, 1.1vw, 10px)" }}>{dateLabel}</span>
              <div className="font-mono font-medium text-zinc-800 dark:text-zinc-200 mt-0.5" style={{ fontSize: "clamp(8px, 1.4vw, 12px)" }}>{dateValue}</div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-zinc-400 dark:text-zinc-500 block" style={{ fontSize: "clamp(5px, 1.1vw, 10px)" }}>
                {isIllegal ? "สถานที่ทำงาน / สถานที่ตรวจเจอ" : "ที่อยู่ปัจจุบันตามบันทึก"}
              </span>
              <div className="font-normal text-zinc-700 dark:text-zinc-300 mt-0.5 line-clamp-2 leading-tight" style={{ fontSize: "clamp(8px, 1.4vw, 12px)" }}>
                {getLocationText()}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}