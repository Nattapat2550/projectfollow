"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import IllegalTable, { SortField } from "@/components/immigrants/IllegalTable";
import UniversalImmigrantCard from "@/components/immigrants/UniversalImmigrantCard";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
const illegalTranslationMap: { [key: string]: string } = {
  id: "รหัสอ้างอิงระบบ",
  first_name_th: "ชื่อจริง (ภาษาไทย)",
  middle_name_th: "ชื่อกลาง (ภาษาไทย)",
  last_name_th: "นามสกุล (ภาษาไทย)",
  first_name_en: "ชื่อจริง (ภาษาอังกฤษ)",
  middle_name_en: "ชื่อกลาง (ภาษาอังกฤษ)",
  last_name_en: "นามสกุล (ภาษาอังกฤษ)",
  passport_id: "เลขที่หนังสือเดินทาง (Passport ID)",
  gender: "เพศ",
  nationality: "สัญชาติ",
  date_of_birth: "วันเกิด",
  detected_date: "วันที่ตรวจพบ",
  detected_location_details: "รายละเอียดสถานที่ตรวจพบ",
  detected_location_sub_district: "ตำบลที่ตรวจพบ",
  detected_location_district: "อำเภอที่ตรวจพบ",
  detected_location_province: "จังหวัดที่ตรวจพบ",
  workplace: "สถานที่ทำงาน/จุดตรวจพบ",
  screening_details: "รายละเอียดคัดกรอง",
  is_victim: "สถานะการคัดแยกผู้เสียหาย",
  note: "หมายเหตุ",
  photo_url: "ลิงก์รูปถ่ายโปรไฟล์",
  passport_photo_url: "ลิงก์รูปถ่ายหนังสือเดินทาง",
  created_by: "รหัสผู้บันทึกข้อมูล",
  created_at: "วันเวลาที่สร้างข้อมูล",
  updated_at: "วันเวลาที่แก้ไขล่าสุด",
  creator_name: "ชื่อผู้บันทึกข้อมูล",
  creator_color: "โค้ดสีของผู้บันทึก",
};

const formatValue = (key: string, val: any) => {
  if (val === null || val === undefined) return "-";
  if (key.includes("date") && typeof val === "string" && !isNaN(Date.parse(val))) {
    return new Date(val).toLocaleDateString("th-TH");
  }
  if (val === true || val === "true") return "ใช่";
  if (val === false || val === "false") return "ไม่ใช่";
  return val;
};

function IllegalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [isExportMode, setIsExportMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const selectedIds = selectedRows.map(r => r.id);

  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    setIsLoggedIn(!!token && token !== "null");
  }, []);

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
        setError(null);
        if (!data) setLoading(true);
        else setIsUpdating(true);
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        
        const params = new URLSearchParams({
          type: "illegal",
          page: currentPage.toString(),
          limit: "50"
        });

        if (sortField) {
          params.append("sortBy", sortField);
          params.append("sortOrder", sortDirection);
        }

        if (debouncedSearch.trim()) {
          params.append("search", debouncedSearch.trim());
        }

        const res = await fetch(`${backendUrl}/api/v1/immigrants/dashboard?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลจากเซิร์ฟเวอร์ได้");
        
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error("Fetch Error:", err);
        setError(err.message);
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // setIsExportMode(false);
    // setSelectedRows([]);
  };

  const handleCancelExport = () => {
    setIsExportMode(false);
    setSelectedRows([]);
  };

  const handleToggleSelect = (id: string) => {
    const isSelected = selectedRows.some(r => r.id === id);
    if (isSelected) {
      setSelectedRows(prev => prev.filter(r => r.id !== id));
    } else {
      const person = tableRows.find((r: any) => r.id === id);
      if (person) setSelectedRows(prev => [...prev, person]);
    }
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      const newRows = [...selectedRows];
      tableRows.forEach((r: any) => {
        if (!newRows.some(nr => nr.id === r.id)) newRows.push(r);
      });
      setSelectedRows(newRows);
    } else {
      const currentViewIds = tableRows.map((r: any) => r.id);
      setSelectedRows(prev => prev.filter(r => !currentViewIds.includes(r.id)));
    }
  };

  const handleExportConfirm = async () => {
    if (selectedRows.length === 0) {
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: "กรุณาเลือกข้อมูลอย่างน้อย 1 รายการ", icon: "warning" });
      return;
    }
    
    const result = await Swal.fire({
      title: "เลือกรูปแบบการ Export",
      text: `คุณได้เลือกข้อมูล ${selectedRows.length} รายการ`,
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Excel",
      denyButtonText: "PDF",
      cancelButtonText: "ยกเลิก"
    });

    if (result.isConfirmed) {
      // Excel
      const selectedData = selectedRows.map((person: any) => {
        const row: any = {};
        const formattedKeys = ["first_name_th", "middle_name_th", "last_name_th", "first_name_en", "middle_name_en", "last_name_en", "detected_date", "is_victim", "id"];

        const fullNameTh = `${person.first_name_th || ""} ${person.middle_name_th || ""} ${person.last_name_th || ""}`.replace(/\s+/g, ' ').trim();
        const fullNameEn = `${person.first_name_en || ""} ${person.middle_name_en || ""} ${person.last_name_en || ""}`.replace(/\s+/g, ' ').trim();
        const finalName = fullNameTh || fullNameEn || "ไม่ระบุชื่อ";

        row["ชื่อ - นามสกุล"] = finalName;
        row["วันที่ตรวจพบ"] = person.detected_date ? new Date(person.detected_date).toLocaleDateString("th-TH") : "-";
        row["สถานะผู้เสียหาย"] = person.is_victim === "YES" || person.is_victim === true || person.is_victim === "true" ? "เป็นผู้เสียหาย" : person.is_victim === "NO" || person.is_victim === false || person.is_victim === "false" ? "ไม่เป็นผู้เสียหาย" : "ไม่คัดกรองสถานะ";

        Object.keys(person).forEach(key => {
          if (!formattedKeys.includes(key)) {
            const thaiKey = illegalTranslationMap[key] || key;
            row[thaiKey] = formatValue(key, person[key]);
          }
        });
        return row;
      });
      const ws = XLSX.utils.json_to_sheet(selectedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Illegal Immigrants");
      XLSX.writeFile(wb, "illegal_immigrants.xlsx");
      handleCancelExport();
    } else if (result.isDenied) {
      // PDF
      setIsExporting(true);
      Swal.fire({ title: "กำลังสร้าง PDF", text: "กรุณารอสักครู่...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        let pdf: any = null;
        for (let i = 0; i < selectedRows.length; i++) {
          const id = selectedRows[i].id;
          const element = document.getElementById(`pdf-card-${id}`);
          if (element) {
            // Use html-to-image to perfectly preserve Thai typography (vowels/tones) and CSS layout
            const imgData = await toPng(element, { pixelRatio: 2, cacheBust: true });
            
            const width = element.offsetWidth * 2;
            const height = element.offsetHeight * 2;
            
            if (!pdf) {
              pdf = new jsPDF("l", "px", [width, height]);
            } else {
              pdf.addPage([width, height], "l");
            }
            pdf.addImage(imgData, "PNG", 0, 0, width, height);
          }
        }
        if (pdf) pdf.save("illegal_immigrants.pdf");
      } catch (err) {
        console.error("PDF Export error:", err);
        Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถสร้างไฟล์ PDF ได้", "error");
      } finally {
        setIsExporting(false);
        handleCancelExport();
        Swal.close();
      }
    }
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
    <div className="w-full p-4 sm:p-6 text-foreground" style={{ backgroundColor: "var(--wrapper)", minHeight: "calc(100vh - 80px)" }}>
      <div 
        className="w-full"
        style={{
          backgroundColor: "var(--wrapper)",
          borderRadius: "0.2rem",
          boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.25)",
          overflow: "hidden"
        }}
      >
        <div className="p-5 sm:p-6" style={{ backgroundColor: "var(--container)", minHeight: "calc(100vh - 120px)" }}>
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-(--header)">ข้อมูลผู้ลักลอบเข้าเมือง (Illegal)</h1>
            <div className="flex gap-2">
              {isExportMode ? (
                <>
                  <button onClick={handleCancelExport} className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 text-foreground font-bold rounded-sm hover:opacity-90 transition text-sm cursor-pointer">
                    ยกเลิก
                  </button>
                  <button onClick={handleExportConfirm} disabled={isExporting} className="px-4 py-2 bg-(--blueText) text-(--button) font-bold rounded-sm hover:opacity-90 transition text-sm cursor-pointer disabled:opacity-50">
                    {isExporting ? "กำลัง Export..." : `ยืนยัน (${selectedRows.length})`}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => {
                      if (!isLoggedIn) {
                        router.push('/login');
                        return;
                      }
                      setIsExportMode(true);
                    }} 
                    className="px-4 py-2 bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 font-bold rounded-sm hover:opacity-90 transition text-sm cursor-pointer"
                  >
                    Export
                  </button>
                  <Link href="/immigrants/illegal/create" className="px-4 py-2 bg-(--header) text-background font-bold rounded-sm hover:opacity-90 transition text-sm">
                    + เพิ่มข้อมูล
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="mb-6 flex items-center px-4 py-2 border rounded-sm shadow-[0_1px_2px_var(--shadow)] bg-(--container) border-(--wrapper) text-foreground focus-within:ring-2 focus-within:ring-(--header) transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหาชื่อ, สัญชาติ, สถานที่... (ใช้ช่องว่างแยกคำ เช่น 'สมชาย พม่า')"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-base text-foreground placeholder:text-zinc-400 placeholder:text-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="hover:opacity-70 transition ml-2 text-zinc-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-sm border border-red-200">
              เกิดข้อผิดพลาด: {error}
            </div>
          )}

          {loading && !data ? (
            <div className="flex flex-col items-center justify-center h-64">
               <div className="animate-spin rounded-full h-10 w-10 border-4 border-(--wrapper) border-t-(--header) mb-4"></div>
               <span className="text-muted-foreground text-sm font-medium">กำลังโหลดข้อมูล...</span>
            </div>
          ) : (
            <div className={`bg-transparent mb-10 transition-opacity duration-300 ${isUpdating ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              <div className="mb-4 text-sm text-muted-foreground font-medium flex justify-between items-center">
                <span>ตารางข้อมูล ({totalItems.toLocaleString("th-TH")} รายการ)</span>
                {isUpdating && <span className="text-(--header) animate-pulse text-xs">กำลังอัปเดต...</span>}
              </div>
              
              <IllegalTable 
                data={tableRows} 
                sortField={sortField} 
                sortDirection={sortDirection} 
                onSort={handleSort} 
                isExportMode={isExportMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
              />

              {totalPages > 0 && (() => {
                 let startPage = Math.max(1, currentPage - 5);
                 let endPage = Math.min(totalPages, currentPage + 5);

                 if (endPage - startPage < 10) {
                   if (startPage === 1) {
                     endPage = Math.min(totalPages, startPage + 10);
                   } else if (endPage === totalPages) {
                     startPage = Math.max(1, endPage - 10);
                   }
                 }

                 const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

                 return (
                   <div className="flex flex-col md:flex-row justify-between items-center p-4 border rounded-sm mt-6 shadow-[0_1px_2px_var(--shadow)] bg-(--container) border-(--wrapper) gap-4">
                     <span className="text-sm font-medium opacity-70">
                       หน้า {currentPage} จาก {totalPages}
                     </span>

                     <div className="flex items-center gap-1 sm:gap-2">
                       <button
                         disabled={currentPage === 1}
                         onClick={() => handlePageChange(1)}
                         className="px-3 py-2 border rounded-sm disabled:opacity-30 text-sm font-medium transition cursor-pointer bg-(--button) border-(--wrapper) hover:bg-(--row-hover) text-foreground"
                         title="หน้าแรกสุด"
                       >
                         &laquo;
                       </button>
                       <button
                         disabled={currentPage === 1}
                         onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                         className="px-3 py-2 border rounded-sm disabled:opacity-30 text-sm font-medium transition cursor-pointer bg-(--button) border-(--wrapper) hover:bg-(--row-hover) text-foreground"
                         title="ก่อนหน้า"
                       >
                         &lsaquo;
                       </button>

                       <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
                         {pageNumbers.map((page) => (
                           <button
                             key={page}
                             onClick={() => handlePageChange(page)}
                             className={`px-3 py-2 border rounded-sm text-sm font-medium transition cursor-pointer ${
                               page === currentPage
                                 ? "bg-(--header) text-background font-bold pointer-events-none border-transparent"
                                 : "bg-(--button) border-(--wrapper) text-foreground hover:bg-(--row-hover)"
                             }`}
                           >
                             {page}
                           </button>
                         ))}
                       </div>

                       <button
                         disabled={currentPage === totalPages}
                         onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                         className="px-3 py-2 border rounded-sm disabled:opacity-30 text-sm font-medium transition cursor-pointer bg-(--button) border-(--wrapper) hover:bg-(--row-hover) text-foreground"
                         title="ถัดไป"
                       >
                         &rsaquo;
                       </button>
                       <button
                         disabled={currentPage === totalPages}
                         onClick={() => handlePageChange(totalPages)}
                         className="px-3 py-2 border rounded-sm disabled:opacity-30 text-sm font-medium transition cursor-pointer bg-(--button) border-(--wrapper) hover:bg-(--row-hover) text-foreground"
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
      </div>
      
      {/* Hidden container for PDF rendering */}
      {isExportMode && selectedRows.length > 0 && (
        <div style={{ position: "absolute", left: "-9999px", top: 0, fontFamily: "'Sarabun', sans-serif" }}>
          {selectedRows.map((person: any) => (
            <div key={person.id} id={`pdf-card-${person.id}`} style={{ width: "856px", minHeight: "540px", height: "max-content", backgroundColor: "white" }}>
              <UniversalImmigrantCard data={person} type="illegal" isExporting={true} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IllegalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-500 mr-3"></div>กำลังเริ่มระบบตารางข้อมูล...</div>}>
      <IllegalPageContent />
    </Suspense>
  );
}