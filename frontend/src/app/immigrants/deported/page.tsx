"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImmigrantsTable from "@/components/immigrants/ImmigrantsTable";

export default function DeportedPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // สร้าง State สำหรับระบบแบ่งหน้า (Pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/v1/immigrants`);
        if (!res.ok) throw new Error("API error");
        
        const json = await res.json();
        const fetchedRecords = json.data?.deporteds || [];
        setData(fetchedRecords);
      } catch (err) {
        console.error("Error fetching deporteds:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // คำนวณข้อมูลที่จะแสดงในแต่ละหน้า
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold transition-opacity hover:opacity-80 flex items-center gap-2" style={{ color: "var(--header)" }}>
            {"< ส่งกลับ"}
          </Link>
        </div>

        {loading && <div className="text-center py-10 opacity-60">กำลังโหลดข้อมูลระบบ...</div>}
        
        {!loading && (
          <>
            <ImmigrantsTable data={paginatedData} isMock={false} type="deported" />
            
            {/* กล่องควบคุมการเปลี่ยนหน้า (แสดงก็ต่อเมื่อมีมากกว่า 1 หน้า) */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl mt-6 shadow-sm">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)} 
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
                >
                  ก่อนหน้า
                </button>
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  หน้า {currentPage} จาก {totalPages} (ทั้งหมด {data.length} รายการ)
                </span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)} 
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}