import React from "react";

interface IllegalCardProps {
  data: any; 
}

// ฟังก์ชันดึง Thumbnail จาก Google Drive
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

export default function IllegalCard({ data }: IllegalCardProps) {
  const fullNameTh = `${data.first_name_th || ""}${data.middle_name_th ? " " + data.middle_name_th : ""} ${data.last_name_th || ""}`.trim();
  const fullNameEn = data.first_name_en
    ? `${data.first_name_en}${data.middle_name_en ? " " + data.middle_name_en : ""} ${data.last_name_en ?? ""}`.trim()
    : "";

  const detectedDateFormatted = data.detected_date
    ? new Date(data.detected_date).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  return (
    <div className="relative w-full bg-[#DFF5EC] rounded-2xl border border-[#9DD8BE] shadow-md overflow-hidden font-sans" style={{ aspectRatio: "856 / 540" }}>
      <div className="absolute inset-0 flex p-[4%] gap-[4%]">
        <div className="flex flex-col items-center shrink-0" style={{ width: "30%" }}>
          <p className="font-bold text-emerald-900 text-center leading-tight mb-[3%]" style={{ fontSize: "clamp(8px, 2.4vw, 20px)" }}>ผู้แอบเข้าประเทศ</p>
          <span className="text-red-500 font-bold bg-red-50 border border-red-200 rounded-full text-center mb-[5%]" style={{ fontSize: "clamp(5px, 1.2vw, 11px)", padding: "1% 8%" }}>
            สัญชาติ: {data.nationality || "ไม่ระบุ"}
          </span>
          <div className="bg-white border border-emerald-200 rounded-xl flex items-end justify-center overflow-hidden shadow-inner relative w-full" style={{ aspectRatio: "3/4" }}>
            {data.photo_url ? (
               <img 
                 src={getDirectImageUrl(data.photo_url)} 
                 alt="Profile" 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer" /* กุญแจสำคัญในการเลี่ยงการบล็อก */
               />
            ) : (
              <div className="flex flex-col items-center justify-end w-full h-full pb-[8%]">
                <div className="bg-[#BDBDBD] rounded-full" style={{ width: "42%", aspectRatio: "1/1", marginBottom: "4%" }} />
                <div className="bg-[#BDBDBD] rounded-t-full" style={{ width: "72%", height: "38%" }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-[4%] min-w-0">
          <div className="flex gap-[4%]">
            <div className="flex flex-col gap-[6%] flex-1"><ILabel>จากประเทศ</ILabel><IBox>{data.nationality || "-"}</IBox></div>
            <div className="flex flex-col gap-[6%] flex-1"><ILabel>เลขที่หนังสือเดินทาง</ILabel><IBox mono>{data.passport_id || "-"}</IBox></div>
          </div>

          <div className="flex flex-col gap-[4%]">
            <ILabel>ชื่อ - นามสกุล</ILabel>
            <IBox noTruncate>
              <div className="truncate">{fullNameTh || "ไม่ระบุชื่อ"}</div>
              {fullNameEn && <div className="truncate text-[0.82em] opacity-75 font-normal tracking-wide mt-[0.5%]">{fullNameEn}</div>}
            </IBox>
          </div>

          <div className="flex gap-[4%]">
            <div className="flex flex-col gap-[6%]" style={{ width: "55%" }}><ILabel>สัญชาติ</ILabel><IBox>{data.nationality || "-"}</IBox></div>
            <div className="flex flex-col gap-[6%] flex-1"><ILabel>เพศ</ILabel><IBox>{data.gender || "-"}</IBox></div>
          </div>

          <div className="flex flex-col gap-[4%]">
            <ILabel>วันที่ตรวจเจอ</ILabel>
            <IBox>{detectedDateFormatted}</IBox>
          </div>
        </div>
      </div>
    </div>
  );
}

function ILabel({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-emerald-950" style={{ fontSize: "clamp(5px, 1.3vw, 11px)" }}>{children}</span>;
}
function IBox({ children, mono = false, noTruncate = false }: { children: React.ReactNode; mono?: boolean; noTruncate?: boolean; }) {
  return (
    <div className={`bg-[#B8E8D4] rounded-md text-emerald-900 font-medium ${mono ? "font-mono" : ""} ${noTruncate ? "flex flex-col justify-center" : "truncate"}`} style={{ fontSize: "clamp(6px, 1.5vw, 13px)", padding: "4% 6%", minHeight: "18%" }}>
      {children}
    </div>
  );
}