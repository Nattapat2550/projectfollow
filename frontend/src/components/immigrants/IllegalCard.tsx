import React from "react";

export interface IllegalImmigrant {
  id: string;
  first_name_th: string;
  middle_name_th?: string;
  last_name_th: string;
  first_name_en?: string;
  middle_name_en?: string;
  last_name_en?: string;
  nationality?: string;
  passport_id?: string;
  detected_location: string;
  is_victim?: boolean;
  gender?: string;
  detected_date?: string; // ISO date string
  workplace?: string;
  screening_details?: string;
}

interface IllegalCardProps {
  data: IllegalImmigrant;
}

export default function IllegalCard({ data }: IllegalCardProps) {
  const fullNameTh =
    `${data.first_name_th}${data.middle_name_th ? " " + data.middle_name_th : ""} ${data.last_name_th}`.trim();

  // ดึงข้อมูลชื่อภาษาอังกฤษมาประกอบกันแบบมีเงื่อนไขรองรับชื่อกลาง
  const fullNameEn = data.first_name_en
    ? `${data.first_name_en}${data.middle_name_en ? " " + data.middle_name_en : ""} ${data.last_name_en ?? ""}`.trim()
    : "";

  const detectedDateFormatted = data.detected_date
    ? new Date(data.detected_date).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

  return (
    /*
     * อัตราส่วนบัตร ปชช 85.6 : 54 mm  →  aspect-ratio: 856/540
     * ขนาดเท่ากับ DeportedCard ทุกประการ ควบคุมจากภายนอกด้วย w-full / max-w
     */
    <div
      className="
        relative w-full
        bg-[#DFF5EC]
        rounded-2xl
        border border-[#9DD8BE]
        shadow-md
        overflow-hidden
        font-sans
      "
      style={{ aspectRatio: "856 / 540" }}
    >
      <div className="absolute inset-0 flex p-[4%] gap-[4%]">

        {/* ══════════ LEFT COLUMN ══════════ */}
        <div
          className="flex flex-col items-center flex-shrink-0"
          style={{ width: "30%" }}
        >
          {/* หัวบัตร */}
          <p
            className="font-bold text-emerald-900 text-center leading-tight mb-[3%]"
            style={{ fontSize: "clamp(8px, 2.4vw, 20px)" }}
          >
            ผู้แอบเข้าประเทศ
          </p>

          {/* ธงชาติ / badge */}
          <span
            className="text-red-500 font-bold bg-red-50 border border-red-200 rounded-full text-center mb-[5%]"
            style={{ fontSize: "clamp(5px, 1.2vw, 11px)", padding: "1% 8%" }}
          >
            ธงประเทศนั้นๆ
          </span>

          {/* รูปถ่าย */}
          <div
            className="bg-white border border-emerald-200 rounded-xl flex items-end justify-center overflow-hidden shadow-inner relative w-full"
            style={{ aspectRatio: "3/4" }}
          >
            <div className="flex flex-col items-center justify-end w-full h-full pb-[8%]">
              <div
                className="bg-[#BDBDBD] rounded-full"
                style={{ width: "42%", aspectRatio: "1/1", marginBottom: "4%" }}
              />
              <div
                className="bg-[#BDBDBD] rounded-t-full"
                style={{ width: "72%", height: "38%" }}
              />
            </div>
          </div>
        </div>

        {/* ══════════ RIGHT COLUMN ══════════ */}
        <div className="flex flex-col flex-1 gap-[4%] min-w-0">

          {/* จากประเทศ + เลขที่หนังสือเดินทาง */}
          <div className="flex gap-[4%]">
            <div className="flex flex-col gap-[6%] flex-1">
              <ILabel>จากประเทศ</ILabel>
              <IBox>{data.nationality ?? "-"}</IBox>
            </div>
            <div className="flex flex-col gap-[6%] flex-1">
              <ILabel>เลขที่หนังสือเดินทาง</ILabel>
              <IBox mono>{data.passport_id ?? "-"}</IBox>
            </div>
          </div>

          {/* ชื่อ–นามสกุล (แสดงทั้ง ไทย และ อังกฤษ ซ้อนกันในกล่องเดียว) */}
          <div className="flex flex-col gap-[4%]">
            <ILabel>ชื่อ - นามสกุล</ILabel>
            <IBox noTruncate>
              <div className="truncate">{fullNameTh}</div>
              {fullNameEn && (
                <div className="truncate text-[0.82em] opacity-75 font-normal tracking-wide mt-[0.5%]">
                  {fullNameEn}
                </div>
              )}
            </IBox>
          </div>

          {/* สัญชาติ + เพศ */}
          <div className="flex gap-[4%]">
            <div className="flex flex-col gap-[6%]" style={{ width: "55%" }}>
              <ILabel>สัญชาติ</ILabel>
              <IBox>{data.nationality ?? "-"}</IBox>
            </div>
            <div className="flex flex-col gap-[6%] flex-1">
              <ILabel>เพศ</ILabel>
              <IBox>{data.gender ?? "-"}</IBox>
            </div>
          </div>

          {/* วันที่ตรวจเจอ */}
          <div className="flex flex-col gap-[4%]">
            <ILabel>วันที่ตรวจเจอ</ILabel>
            <IBox>{detectedDateFormatted}</IBox>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function ILabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-bold text-emerald-950"
      style={{ fontSize: "clamp(5px, 1.3vw, 11px)" }}
    >
      {children}
    </span>
  );
}

function IBox({
  children,
  mono = false,
  noTruncate = false,
}: {
  children: React.ReactNode;
  mono?: boolean;
  noTruncate?: boolean;
}) {
  return (
    <div
      className={`bg-[#B8E8D4] rounded-md text-emerald-900 font-medium ${mono ? "font-mono" : ""} ${noTruncate ? "flex flex-col justify-center" : "truncate"}`}
      style={{ fontSize: "clamp(6px, 1.5vw, 13px)", padding: "4% 6%", minHeight: "18%" }}
    >
      {children}
    </div>
  );
}