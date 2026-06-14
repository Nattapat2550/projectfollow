"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// นำเข้าคอมโพเนนต์ตารางตัวใหม่ที่ไม่มีปุ่มรูปตา และคลิกแถวเพื่อเข้าดูรายละเอียดได้เลย
import IllegalTable from "@/components/immigrants/IllegalTable";

function IllegalPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // States สำหรับควบคุมการเรียงลำดับแบบ Server-side เหมือนหน้า Dashboard
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        
        const params = new URLSearchParams({
          type: "illegal",
          page: currentPage.toString(),
          limit: "50"
        });

        // แนบเงื่อนไขการ Sort ส่งไปให้ฐานข้อมูลหลังบ้านประมวลผล
        if (sortField) {
          params.append("sortBy", sortField);
          params.append("sortOrder", sortDirection);
        }

        const res = await fetch(`${backendUrl}/api/v1/dashboard?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, sortField, sortDirection]);

  // ฟังก์ชันจัดการเมื่อยูสเซอร์คลิกเปลี่ยนการเรียงข้อมูลที่หัวตาราง
  const handleSort = (field: any) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // รีเซ็ตหน้ากลับไปที่หน้า 1 ทุกครั้งที่มีการเปลี่ยนกลุ่มจัดเรียง
  };

  // 🔍 ตรวจสอบสลับชื่อภาษาอังกฤษมาแสดงผลหากไม่มีชื่อภาษาไทย ป้องกันคำว่า "ไม่ระบุ"
  const tableRows = (data?.tableData || []).map((item: any) => {
    const firstName = !item.first_name_th || item.first_name_th.trim() === "" || item.first_name_th === "ไม่ระบุ"
      ? (item.first_name_en || "ไม่ระบุ")
      : item.first_name_th;

    const lastName = !item.last_name_th || item.last_name_th.trim() === "" || item.last_name_th === "ไม่ระบุ"
      ? (item.last_name_en || "ไม่ระบุ")
      : item.last_name_th;

    return {
      ...item,
      first_name_th: firstName,
      last_name_th: lastName,
    };
  });

  const totalItems = data?.meta?.totalItems || 0;
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="p-6 max-w-7xl mx-auto text-foreground">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-(--header)">ข้อมูลผู้แอบเข้าเมือง (Illegal)</h1>
        <Link href="/immigrants/illegal/create" className="px-4 py-2 bg-(--header) text-white font-bold rounded-sm hover:opacity-90 transition text-sm">
          + เพิ่มข้อมูล
        </Link>
      </div>

      {loading ? (
        <div className="text-center p-8 text-muted-foreground">กำลังโหลดข้อมูล...</div>
      ) : (
        <div className="bg-transparent mb-10">
          <div className="mb-4 text-sm text-muted-foreground font-medium">
            ตารางข้อมูล ({totalItems.toLocaleString("th-TH")} รายการ)
          </div>
          
          {/* เรียกตาราง IllegalTable แบบเดียวกันกับที่ใช้ใน Dashboard */}
          <IllegalTable 
            data={tableRows} 
            sortField={sortField} 
            sortDirection={sortDirection} 
            onSort={handleSort} 
          />

          {/* แถบเปลี่ยนหน้าเพจสไตล์เดิม */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-sm mt-6 shadow-sm">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm disabled:opacity-50 text-sm font-medium transition cursor-pointer"
              >
                ก่อนหน้า
              </button>
              <span className="text-sm font-medium">
                หน้า {currentPage} จาก {totalPages}
              </span>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm disabled:opacity-50 text-sm font-medium transition cursor-pointer"
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IllegalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">กำลังเริ่มระบบตารางข้อมูล...</div>}>
      <IllegalPageContent />
    </Suspense>
  );
}