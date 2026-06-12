import React from "react";

interface RightPanelProps {
  type: "deported" | "illegal";
  data: any;
  note: string;
  setNote: (value: string) => void;
}

export default function RightPanel({ type, data, note, setNote }: RightPanelProps) {
  
  const handleSaveNote = () => {
    alert(`บันทึกหมายเหตุเรียบร้อยแล้ว!`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-(--container) border border-(--wrapper) rounded-2xl p-6 shadow-sm transition-colors">
        
        {type === "deported" ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-bold text-(--header) mb-2">ข้อมูลเพิ่มเติม</h3>
            
            <div className="flex justify-between items-center text-sm border-b border-(--wrapper) pb-2">
              <span className="font-bold text-stone-600 dark:text-slate-300">วันที่ส่งกลับ</span>
              <span className="font-mono font-semibold">{formatDate(data.return_date)}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-(--wrapper) pb-2">
              <span className="font-bold text-stone-600 dark:text-slate-300">จำนวน Case ID</span>
              <span className="font-semibold font-mono">{data.number_of_case ?? 0}</span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-(--wrapper) pb-2">
              <span className="font-bold text-stone-600 dark:text-slate-300">จำนวนหมายจับ</span>
              <span className={`font-semibold font-mono ${data.number_of_warrant > 0 ? "text-(--redText)" : ""}`}>
                {data.number_of_warrant ?? 0}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm pb-1">
              <span className="font-bold text-stone-600 dark:text-slate-300">ช่องทางส่งกลับ</span>
              <span className="font-semibold">{data.channel || "-"}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h3 className="text-xl font-bold text-(--header) mb-2">ข้อมูลคัดกรอง</h3>
            
            <div className={`w-full text-center py-2 px-4 rounded-lg font-bold text-sm border shadow-sm ${data.is_victim ? 'bg-red-100 text-red-700 border-red-300' : 'bg-(--yellowBG) text-(--yellowText) border-(--yellowBorder)'}`}>
              {data.is_victim ? "เข้าข่ายเป็นผู้เสียหายจากการค้ามนุษย์" : "ไม่เป็นผู้เสียหายจากการค้ามนุษย์"}
            </div>

            <div className="bg-background border border-(--wrapper) rounded-md p-3 text-xs text-stone-600 dark:text-slate-300 font-medium leading-relaxed shadow-inner min-h-15 mt-2 whitespace-pre-wrap">
              {data.screening_details || "ไม่มีรายละเอียดการคัดกรองระบุไว้"}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-6 border-t border-(--wrapper) pt-4">
          <label className="text-lg font-bold text-(--header)">หมายเหตุระบบ</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-3 text-xs focus:outline-none focus:ring-2 focus:ring-(--header)/40 shadow-inner"
            placeholder="ไม่มีบันทึกหมายเหตุ..."
          />
          <button
            onClick={handleSaveNote}
            className="w-full py-2 bg-(--wrapper) text-foreground hover:opacity-90 font-bold rounded-md active:scale-[0.99] transition text-xs shadow-sm cursor-pointer mt-1"
          >
            บันทึก/อัปเดตหมายเหตุ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => alert("กำลังเข้าสู่โหมดแก้ไขข้อมูล...")}
          className="py-2.5 rounded-lg font-bold text-center text-sm border bg-(--yellowBG) text-(--yellowText) border-(--yellowBorder) hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
        >
          แก้ไขข้อมูล
        </button>

        <button
          onClick={() => { if(confirm("ยืนยันที่จะลบประวัติของบุคคลนี้ออก?")) alert("ลบข้อมูลสำเร็จ"); }}
          className="py-2.5 rounded-lg font-bold text-center text-sm border bg-(--redBG) text-(--redText) border-(--redBorder) hover:opacity-90 active:scale-95 transition shadow-sm cursor-pointer"
        >
          ลบข้อมูล
        </button>
      </div>
    </div>
  );
}