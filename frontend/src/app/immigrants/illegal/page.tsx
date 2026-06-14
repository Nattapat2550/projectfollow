"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ✨ แก้ตรงนี้: นำเข้าคอมโพเนนต์ตารางและ SortField จาก IllegalTable โดยตรง
import IllegalTable, { SortField } from "@/components/immigrants/IllegalTable";

function IllegalPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  
  // States สำหรับควบคุมการเรียงลำดับแบบ Server-side
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!data) {
          setLoading(true);
        } else {
          setIsUpdating(true);
        }
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        
        const params = new URLSearchParams({
          type: "illegal",
          page: currentPage.toString(),
          limit: "50"
        });

        if (sortField) {
          const apiSortField = sortField === "name" ? "first_name_th" : sortField;
          params.append("sortBy", apiSortField);
          params.append("sortOrder", sortDirection);
        }

        if (debouncedSearch.trim()) {
          params.append("search", debouncedSearch.trim());
        }

        const res = await fetch(`${backendUrl}/api/v1/immigrants/dashboard?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
        setIsUpdating(false); 
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortField, sortDirection, debouncedSearch]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1); 
  };

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
        <Link href="/immigrants/illegal/create" className="px-4 py-2 bg-(--header) text-(--background) font-bold rounded-sm hover:opacity-90 transition text-sm">
          + เพิ่มข้อมูล
        </Link>
      </div>

      <div className="mb-6 flex items-center px-4 py-2 border rounded-sm shadow-[0_1px_2px_var(--shadow)] bg-[var(--container)] border-[var(--wrapper)] text-[var(--foreground)]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="ค้นหาแบบเจาะจง... (ใช้ช่องว่างแยกคำค้นหา เช่น 'สมชาย พม่า')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-base text-[var(--foreground)] placeholder:text-zinc-400 placeholder:text-sm"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="hover:opacity-70 transition ml-2">
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
          
          <IllegalTable 
            data={tableRows} 
            sortField={sortField} 
            sortDirection={sortDirection} 
            onSort={handleSort} 
          />

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
               <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-sm mt-6 shadow-sm gap-4">
                 
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

export default function IllegalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">กำลังเริ่มระบบตารางข้อมูล...</div>}>
      <IllegalPageContent />
    </Suspense>
  );
}