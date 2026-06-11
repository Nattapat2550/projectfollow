import React from "react";
import { DeportedPerson } from "@/components/immigrants/mockData";

interface RightPanelProps {
  type: "deported" | "illegal";
  data: DeportedPerson;
  note: string;
  setNote: (value: string) => void;
}

export default function RightPanel({ type, data, note, setNote }: RightPanelProps) {
  
  const handleSaveNote = () => {
    alert(`บันทึกหมายเหตุสําหรับ ${data.first_name_th} เรียบร้อยแล้ว!`);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* กล่องเนื้อหาหลักดึงสีพื้นหลังจาก var(--container) ใน globals.css */}
      <div className="bg-[var(--container)] border border-[var(--wrapper)] rounded-2xl p-6 shadow-sm transition-colors">
        
        {type === "deported" ? (
          /* ================= แสดงฝั่ง ข้อมูลเพิ่มเติม (Deported) ================= */
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-bold text-[var(--header)] mb-2">ข้อมูลเพิ่มเติม</h3>
            
            <div className="flex justify-between items-center text-sm border-b border-[var(--wrapper)] pb-2">
              <span className="font-bold text-stone-600 dark:text-slate-300">วันที่ส่งกลับ</span>
              <span className="font-mono font-semibold">2568-10-12</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-[var(--wrapper)] pb-2">
              <span className="font-bold text-stone-600 dark:text-slate-300">จำนวน Case ID</span>
              <span className="font-semibold font-mono">1</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-[var(--wrapper)] pb-2">
              <span className="font-bold text-stone-600 dark:text-slate-300">จำนวนหมายจับ</span>
              <span className="font-semibold font-mono text-[var(--redText)]">0</span>
            </div>

            <div className="flex justify-between items-center text-sm pb-1">
              <span className="font-bold text-stone-600 dark:text-slate-300">ช่องทางส่งกลับ</span>
              <span className="font-semibold">ช่องทางธรรมชาติ</span>
            </div>
          </div>
        ) : (
          /* ================= แสดงฝั่ง ข้อมูลคัดกรอง (Illegal) ================= */
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-bold text-[var(--header)] mb-2">ข้อมูลคัดกรอง</h3>
            
            {/* สถานะผู้เสียหาย โดยใช้สีแจ้งเตือนสีเหลืองส้มจากระบบ */}
            <div className="w-full text-center py-2 px-4 rounded-lg font-bold text-sm bg-[var(--yellowBG)] text-[var(--yellowText)] border border-[var(--yellowBorder)] shadow-sm">
              ไม่เป็นผู้เสียหายจากการค้ามนุษย์
            </div>

            {/* บล็อกรายละเอียดข้อหาแอบเข้าเมือง */}
            <div className="bg-[var(--background)] border border-[var(--wrapper)] rounded-md p-3 text-xs text-stone-600 dark:text-slate-300 font-medium leading-relaxed shadow-inner min-h-[60px] mt-2">
              เป็นบุคคลต่างด้าวเดินทางเข้ามาและอยู่ในราชอาณาจักรโดยไม่ได้รับอนุญาต ตรวจคัดกรองเบื้องต้นไม่พบพฤติการณ์ตกเป็นเหยื่อแอบแฝง
            </div>
          </div>
        )}

        {/* ================= กล่องหมายเหตุแชร์ฟังก์ชันร่วมกัน ================= */}
        <div className="flex flex-col gap-2 mt-6 border-t border-[var(--wrapper)] pt-4">
          <label className="text-lg font-bold text-[var(--header)]">หมายเหตุระบบ</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full bg-[var(--background)] border border-[var(--wrapper)] text-[var(--foreground)] rounded-md p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--header)]/40 shadow-inner"
            placeholder="พิมพ์บันทึกข้อความภายในที่นี่..."
          />
          <button
            onClick={handleSaveNote}
            className="w-full py-2 bg-[var(--wrapper)] text-[var(--foreground)] hover:opacity-90 font-bold rounded-md active:scale-[0.99] transition text-xs shadow-sm cursor-pointer mt-1"
          >
            บันทึกหมายเหตุ
          </button>
        </div>
      </div>

      {/* ================= ปุ่มแก้ไขข้อมูลและปุ่มลบ ด้านล่างสุด ================= */}
      <div className="grid grid-cols-2 gap-4">
        {/* ปุ่มแก้ไขข้อมูล - ดึงกลุ่มสีเหลืองอมส้มสากลของระบบ */}
        <button
          onClick={() => alert("กำลังเข้าสู่โหมดแก้ไขข้อมูล...")}
          className="py-2.5 rounded-lg font-bold text-center text-sm border bg-[var(--yellowBG)] text-[var(--yellowText)] border-[var(--yellowBorder)] hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
        >
          แก้ไขข้อมูล
        </button>

        {/* ปุ่มลบข้อมูล - ดึงกลุ่มสีแดงแจ้งเตือนอันตรายจากระบบ */}
        <button
          onClick={() => { if(confirm("ยืนยันที่จะลบประวัติของบุคคลนี้ออก?")) alert("ลบข้อมูลสำเร็จ"); }}
          className="py-2.5 rounded-lg font-bold text-center text-sm border bg-[var(--redBG)] text-[var(--redText)] border-[var(--redBorder)] hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
        >
          ลบข้อมูล
        </button>
      </div>
    </div>
  );
}