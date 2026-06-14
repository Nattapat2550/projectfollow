"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// นำเข้าคอมโพเนนต์ตาราง Deported ตัวใหม่ที่คลิกแถวเพื่อเข้าดูรายละเอียดได้โดยตรง
import DeportedTable from "@/components/immigrants/DeportedTable";

function DeportedPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  
  // แยก State Loading ออกเป็น 2 แบบ (โหลดครั้งแรก กับ โหลดเปลี่ยนหน้า)
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  
  // States สำหรับควบคุมการเรียงลำดับแบบ Server-side เหมือนหน้า Dashboard
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 🔍 [จุดที่เพิ่ม 1] States สำหรับระบบค้นหา (Global Search)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ⏳ [จุดที่เพิ่ม 2] ทำ Debounce หน่วงเวลาพิมพ์ 500ms ป้องกันการรัวยิง API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      // ถ้าคำค้นหาเปลี่ยน ให้เด้งกลับไปหน้า 1 เสมอ (แต่ถ้ากด Sort หน้าจะไม่รีเซ็ตคำค้นหา)
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // โหลดครั้งแรกให้หมุนติ้วๆ โหลดครั้งต่อไปแค่เฟดหน้าจอจางลง
        if (!data) {
          setLoading(true);
        } else {
          setIsUpdating(true);
        }
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        
        const params = new URLSearchParams({
          type: "deported",
          page: currentPage.toString(),
          limit: "50"
        });

        // แนบเงื่อนไขการ Sort ส่งไปให้หลังบ้านเรียงลำดับจาก DB
        if (sortField) {
          params.append("sortBy", sortField);
          params.append("sortOrder", sortDirection);
        }

        // 🔍 [จุดที่เพิ่ม 3] แนบคำค้นหา Intersect ส่งไปให้หลังบ้าน
        if (debouncedSearch.trim()) {
          params.append("search", debouncedSearch.trim());
        }

        const res = await fetch(`${backendUrl}/api/v1/dashboard?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
        setIsUpdating(false); // ปิดสถานะจางหน้าจอเมื่อโหลดเสร็จ
      }
    };

    fetchData();
  // 🔍 [จุดที่เพิ่ม 4] เติม debouncedSearch ใน deps เพื่อให้ fetch ใหม่เมื่อพิมพ์เสร็จ
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortField, sortDirection, debouncedSearch]);

  // ฟังก์ชันจัดการเมื่อยูสเซอร์คลิกเปลี่ยนการเรียงข้อมูลที่หัวตาราง
  // ✨ ลอจิกนี้จะรักษาค่า search ไว้ใน State เหมือนเดิม ทำให้ Sort ได้โดยคำค้นหาไม่รีเซ็ต
  const handleSort = (field: any) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); // รีเซ็ตหน้ากลับไปหน้าแรกทุกครั้งที่กดเรียงลำดับใหม่
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
        <h1 className="text-2xl font-bold text-(--header)">ข้อมูลผู้ถูกส่งกลับ (Deported)</h1>
        <Link href="/immigrants/deported/create" className="px-4 py-2 bg-(--header) text-(--background) font-bold rounded-sm hover:opacity-90 transition text-sm">
          + เพิ่มข้อมูล
        </Link>
      </div>

      {/* 🔍 [จุดที่เพิ่ม 5] UI ช่องค้นหาที่ใช้ตัวแปรตาม CSS ของคุณ (เข้ากับ Light/Dark Mode เป๊ะๆ) */}
      <div className="mb-6 flex items-center px-4 py-2 border rounded-sm shadow-xs bg-[var(--container)] border-[var(--wrapper)]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="ค้นหาแบบเจาะจง (ใช้ช่องว่างแยกคำ เช่น 'สมชาย พม่า')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-base text-[var(--foreground)] placeholder:text-zinc-400 placeholder:text-sm placeholder:font-normal"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center h-64">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-(--header) mb-4"></div>
           <span className="text-muted-foreground text-sm font-medium">กำลังโหลดข้อมูล...</span>
        </div>
      ) : (
        <div className={`bg-transparent mb-10 transition-opacity duration-300 ${isUpdating ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
          <div className="mb-4 text-sm text-muted-foreground font-medium">
            ตารางข้อมูล ({totalItems.toLocaleString("th-TH")} รายการ)
          </div>
          
          {/* เรียกตาราง DeportedTable แบบเดียวกันกับที่ใช้ใน Dashboard */}
          <DeportedTable 
            data={tableRows} 
            sortField={sortField} 
            sortDirection={sortDirection} 
            onSort={handleSort} 
          />

          {/* แถบเปลี่ยนหน้าเพจ (Pagination) */}
          {totalPages > 1 && (() => {
             let startPage = Math.max(1, currentPage - 5);
             let endPage = Math.min(totalPages, currentPage + 5);

             if (endPage - startPage < 10) {
               if (startPage === 1) {
                 endPage = Math.min(totalPages, startPage + 10);
               } else if (endPage === totalPages) {
                 startPage = Math.max(1, endPage - 10);
               }
             }

             const pageNumbers = [];
             for (let i = startPage; i <= endPage; i++) {
               pageNumbers.push(i);
             }

             return (
               <div className="flex flex-col md:flex-row justify-between items-center bg-[var(--container)] p-4 border border-[var(--wrapper)] rounded-sm mt-6 shadow-sm gap-4">
                 
                 <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                   หน้า {currentPage} จาก {totalPages}
                 </span>

                 <div className="flex items-center gap-1 sm:gap-2">
                   <button
                     disabled={currentPage === 1}
                     onClick={() => setCurrentPage(1)}
                     className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                     title="หน้าแรกสุด"
                   >
                     &laquo;
                   </button>

                   <button
                     disabled={currentPage === 1}
                     onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                     className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                     title="ก่อนหน้า"
                   >
                     &lsaquo;
                   </button>

                   {/* กล่องแสดงตัวเลขหน้า */}
                   <div className="hidden sm:flex items-center gap-1">
                     {pageNumbers.map((page) => (
                       <button
                         key={page}
                         onClick={() => setCurrentPage(page)}
                         className={`px-3 py-2 border rounded-sm text-sm font-medium transition cursor-pointer ${
                           page === currentPage
                             ? "bg-zinc-800 text-white border-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200 pointer-events-none"
                             : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                         }`}
                       >
                         {page}
                       </button>
                     ))}
                   </div>

                   <button
                     disabled={currentPage === totalPages}
                     onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                     className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                     title="ถัดไป"
                   >
                     &rsaquo;
                   </button>

                   <button
                     disabled={currentPage === totalPages}
                     onClick={() => setCurrentPage(totalPages)}
                     className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-sm disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                     title="หน้าท้ายสุด"
                   >
                     &raquo;
                   </button>
                 </div>
               </div>
             );
          })()}
        </div>
      )}
    </div>
  );
}

export default function DeportedPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">กำลังเริ่มระบบตารางข้อมูล...</div>}>
      <DeportedPageContent />
    </Suspense>
  );
}