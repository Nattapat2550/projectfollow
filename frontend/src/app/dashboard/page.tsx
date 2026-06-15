"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import IllegalTable, { SortField as IllegalSortField } from "@/components/immigrants/IllegalTable";
import DeportedTable, { SortField as DeportedSortField } from "@/components/immigrants/DeportedTable";

// ─── Interfaces & Types ──────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: number | string;
}

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

interface DashboardData {
  stats: {
    total: number;
    victims?: number;
    hasPassport?: number;
    success?: number;
  };
  charts: {
    nationality?: { name: string; value: number }[];
    victim?: { name: string; value: number }[];
    passport?: { name: string; value: number }[];
    channel?: { name: string; value: number }[];
  };
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    allNationalities: string[];
    allGenders: string[];
  };
  tableData: any[];
}

const CHART_COLORS = [
  "#6B3A3A",
  "#A0522D",
  "#CD853F",
  "#DEB887",
  "#9E7B5A",
  "#8B7355",
];

const dashboardFetchCache = new Map<string, DashboardData>();

// ─── คอมโพเนนต์กราฟวงกลม Donut Chart (SVG) ───────────────────────────────────

function DonutChart({ data, title }: { data: ChartItem[]; title: string; }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const SIZE = 240; 
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 100; // รัศมีวงนอก ใหญ่ขึ้น
  const r = 60;  // รัศมีวงใน

  let cumulative = 0;
  const slices = data.map((d) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += d.value;
    let endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    if (endAngle - startAngle === 2 * Math.PI) {
        endAngle -= 0.0001; 
    }
    return { ...d, startAngle, endAngle };
  });

  function polarToCart(angle: number, radius: number) {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  function arcPath(startAngle: number, endAngle: number): string {
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const s = polarToCart(startAngle, R);
    const e = polarToCart(endAngle, R);
    const si = polarToCart(startAngle, r);
    const ei = polarToCart(endAngle, r);
    return [
      `M ${s.x} ${s.y}`,
      `A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`,
      `L ${ei.x} ${ei.y}`,
      `A ${r} ${r} 0 ${large} 0 ${si.x} ${si.y}`,
      "Z",
    ].join(" ");
  }

  return (
    <div className="flex flex-col items-center justify-start gap-3 w-full xl:flex-1 xl:min-w-50 overflow-hidden">
      <p className="text-sm font-semibold shrink-0 text-(--header)">{title}</p>

      <div className="w-full flex items-center justify-center shrink-0 h-55">
        <svg 
          viewBox={`0 0 ${SIZE} ${SIZE}`} 
          style={{ width: "100%", height: "100%" }}
        >
          {slices.map((s, i) => (
            <path key={i} d={arcPath(s.startAngle, s.endAngle)} fill={s.color} />
          ))}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="24" fontWeight="bold" fill="currentColor" className="text-(--header)">
            {total.toLocaleString("th-TH")}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" fontSize="12" fill="currentColor" className="opacity-60 text-foreground">
            ทั้งหมด
          </text>
        </svg>
      </div>

      <div className="flex flex-col gap-1 w-full max-w-65 shrink-0 mt-1">
        {data.map((d, i) => {
          const pct = ((d.value / total) * 100).toFixed(1);
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="rounded-sm shrink-0 w-2.5 h-2.5" style={{ backgroundColor: d.color }} />
              <span className="truncate flex-1 text-foreground">{d.name}</span>
              <span className="font-mono font-semibold shrink-0 text-(--header)">
                {d.value} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── คอมโพเนนต์เนื้อหาแดชบอร์ดหลัก ─────────────────────────────────────────────

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = (searchParams.get("type") as "illegal" | "deported") || "illegal";

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true); 
  const [isUpdating, setIsUpdating] = useState(false); 

  // States สำหรับระบุ Filters ตัวกรองข้อมูล
  const [filterType, setFilterType] = useState<"illegal" | "deported">(typeParam);
  const [filterNat, setFilterNat] = useState<string>("ทั้งหมด");
  const [filterGender, setFilterGender] = useState<string>("ทั้งหมด");
  const [filterVictim, setFilterVictim] = useState<string>("ทั้งหมด");
  const [filterPassport, setFilterPassport] = useState<string>("ทั้งหมด");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const [dobStart, setDobStart] = useState<string>("");
  const [dobEnd, setDobEnd] = useState<string>("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    
    const params = new URLSearchParams({
      type: filterType,
      nationality: filterType === "illegal" ? filterNat : "ทั้งหมด",
      gender: filterGender,
      startDate,
      endDate,
      isVictim: filterType === "illegal" ? filterVictim : "ทั้งหมด",
      hasPassport: filterType === "illegal" ? filterPassport : "ทั้งหมด",
      page: currentPage.toString(),
      limit: "50"
    });

    if (filterType === "deported") {
      if (dobStart) params.append("dobStart", dobStart);
      if (dobEnd) params.append("dobEnd", dobEnd);
    }

    if (sortField) {
      params.append("sortBy", sortField);
      params.append("sortOrder", sortDirection);
    }

    const url = `${backendUrl}/api/v1/dashboard?${params.toString()}`;

    if (dashboardFetchCache.has(url)) {
      setDashboardData(dashboardFetchCache.get(url)!);
      setLoading(false);
      setIsUpdating(false);
    } else {
      if (!dashboardData) setLoading(true);
      else setIsUpdating(true);
    }

    const controller = new AbortController();
    
    fetch(url, { cache: "no-store", signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((json) => {
        dashboardFetchCache.set(url, json);
        setDashboardData(json);
        setLoading(false);
        setIsUpdating(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Fetch Error:", err);
        setLoading(false);
        setIsUpdating(false);
      });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterNat, filterGender, filterVictim, filterPassport, startDate, endDate, dobStart, dobEnd, currentPage, sortField, sortDirection]);

  useEffect(() => {
    if (typeParam !== filterType) {
      setFilterType(typeParam);
      setCurrentPage(1);
      setSortField(""); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeParam]);

  const handleFilterChange = (setter: Function, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
        setSortField(field);
        setSortDirection("asc");
    }
    setCurrentPage(1); 
  };

  const nationalitiesOptions = dashboardData?.meta?.allNationalities || ["ทั้งหมด"];
  const gendersOptions = dashboardData?.meta?.allGenders || ["ทั้งหมด"];

  const tableRows = (dashboardData?.tableData || []).map((item: any) => {
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

  const stats: StatItem[] = (() => {
    if (!dashboardData) return [];
    if (filterType === "illegal") {
      return [
        { label: "จำนวนทั้งหมดที่พบตามตัวกรอง", value: dashboardData.stats.total },
        { label: "เป็นผู้เสียหาย (ค้ามนุษย์)", value: dashboardData.stats.victims || 0 },
        { label: "ผู้มีหนังสือเดินทาง", value: dashboardData.stats.hasPassport || 0 },
      ];
    } else {
      return [
        { label: "จำนวนทั้งหมดที่พบตามตัวกรอง", value: dashboardData.stats.total },
        { label: "ส่งกลับสำเร็จ", value: dashboardData.stats.success || 0 },
      ];
    }
  })();

  const natChart = (() => {
    const raw = dashboardData?.charts?.nationality || [];
    const sum = raw.reduce((acc, curr) => acc + curr.value, 0);
    const total = dashboardData?.stats?.total || 0;
    
    const mapped = raw.map((d, i) => ({
      ...d, color: CHART_COLORS[i % CHART_COLORS.length]
    }));

    if (total > sum) {
      mapped.push({ name: "อื่นๆ", value: total - sum, color: "#737373" });
    }
    return mapped;
  })();

  const victimChart = (dashboardData?.charts?.victim || []).map((d, i) => ({
    ...d, color: d.name === "เป็นผู้เสียหาย" ? CHART_COLORS[0] : CHART_COLORS[2]
  }));

  const passportChart = (dashboardData?.charts?.passport || []).map((d, i) => ({
    ...d, color: d.name === "มีหนังสือเดินทาง" ? CHART_COLORS[1] : CHART_COLORS[3]
  }));

  const channelChart = (() => {
    const raw = dashboardData?.charts?.channel || [];
    const sum = raw.reduce((acc, curr) => acc + curr.value, 0);
    const total = dashboardData?.stats?.total || 0;

    const mapped = raw.map((d, i) => ({
      ...d, color: CHART_COLORS[i % CHART_COLORS.length]
    }));

    if (total > sum) {
      mapped.push({ name: "อื่นๆ", value: total - sum, color: "#737373" });
    }
    return mapped;
  })();

  const inputClass = "w-full bg-background border border-[var(--wrapper)] text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--header)]/40 [&::-webkit-calendar-picker-indicator]:dark:invert";

  return (
    <div className="w-full p-4 sm:p-6 transition-colors duration-200" style={{ backgroundColor: "var(--wrapper)", minHeight: "calc(100vh - 80px)" }}>
      
      <Link
        href="/"
        className="inline-flex items-center gap-1 font-bold mb-6 hover:opacity-80 transition text-(--header) text-2xl"
      >
        {"< แดชบอร์ด"}
      </Link>

      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        
        {/* ── โซนฝั่งซ้าย: แผงควบคุม Filters ──────────────────────────── */}
        <div className="bg-(--container) border border-(--wrapper) rounded-[0.2rem] shadow-[4px_4px_0px_rgba(0,0,0,0.25)] p-6 shrink-0 flex flex-col gap-5 w-full lg:w-72">
          <span className="font-bold text-lg text-(--header)">
            ฟิลเตอร์ตัวเลือก
          </span>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-stone-600 dark:text-slate-300">ประเภทข้อมูล</label>
            <select
              value={filterType}
              onChange={(e) => {
                const val = e.target.value as "illegal" | "deported";
                setFilterType(val);
                setFilterNat("ทั้งหมด");
                setFilterGender("ทั้งหมด");
                setFilterVictim("ทั้งหมด");
                setFilterPassport("ทั้งหมด");
                setStartDate("");
                setEndDate("");
                setDobStart("");
                setDobEnd("");
                setSortField(""); 
                setCurrentPage(1);
                router.replace(`/dashboard?type=${val}`, { scroll: false }); 
              }}
              className={inputClass}
            >
              <option value="illegal">ผู้แอบเข้า (Illegal)</option>
              <option value="deported">ผู้ถูกส่งกลับ (Deported)</option>
            </select>
          </div>

          {filterType === "illegal" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-stone-600 dark:text-slate-300">สัญชาติ</label>
              <select
                value={filterNat}
                onChange={(e) => handleFilterChange(setFilterNat, e.target.value)}
                className={inputClass}
              >
                {nationalitiesOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-stone-600 dark:text-slate-300">เพศ</label>
            <select
              value={filterGender}
              onChange={(e) => handleFilterChange(setFilterGender, e.target.value)}
              className={inputClass}
            >
              {gendersOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {filterType === "illegal" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-stone-600 dark:text-slate-300">สถานะผู้เสียหาย</label>
                <select
                  value={filterVictim}
                  onChange={(e) => handleFilterChange(setFilterVictim, e.target.value)}
                  className={inputClass}
                >
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="true">เป็นผู้เสียหาย</option>
                  <option value="false">ไม่เป็นผู้เสียหาย</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-stone-600 dark:text-slate-300">สถานะหนังสือเดินทาง</label>
                <select
                  value={filterPassport}
                  onChange={(e) => handleFilterChange(setFilterPassport, e.target.value)}
                  className={inputClass}
                >
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="true">มีหนังสือเดินทาง</option>
                  <option value="false">ไม่มีหนังสือเดินทาง / ไม่มีข้อมูล</option>
                </select>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2 mt-2">
            <label className="text-sm font-bold text-stone-600 dark:text-slate-300">
              {filterType === "deported" ? "วันที่ส่งกลับ (ตั้งแต่)" : "ตั้งแต่วันที่"}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-stone-600 dark:text-slate-300">
              {filterType === "deported" ? "วันที่ส่งกลับ (ถึง)" : "ถึงวันที่"}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
              className={inputClass}
            />
          </div>

          {filterType === "deported" && (
            <>
              <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-(--wrapper)">
                <label className="text-sm font-bold text-stone-600 dark:text-slate-300">วันเกิดตั้งแต่</label>
                <input
                  type="date"
                  value={dobStart}
                  onChange={(e) => handleFilterChange(setDobStart, e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-stone-600 dark:text-slate-300">ถึงวันที่ (วันเกิด)</label>
                <input
                  type="date"
                  value={dobEnd}
                  onChange={(e) => handleFilterChange(setDobEnd, e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <button
            onClick={() => {
              setFilterNat("ทั้งหมด");
              setFilterGender("ทั้งหมด");
              setFilterVictim("ทั้งหมด");
              setFilterPassport("ทั้งหมด");
              setStartDate("");
              setEndDate("");
              setDobStart("");
              setDobEnd("");
              setSortField("");
              setCurrentPage(1);
            }}
            className="mt-2 w-full py-2 bg-(--wrapper) text-foreground font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition text-sm cursor-pointer shadow-sm"
          >
            รีเซ็ตทั้งหมด
          </button>
        </div>

        {/* ── โซนฝั่งขวา: แสดงสถิติ กราฟ และ ตารางข้อมูล ────────────────── */}
        <div className="flex flex-col gap-6 flex-1 min-w-0 w-full relative">
          
          {loading && !dashboardData ? (
            <div className="flex flex-col items-center justify-center h-64 bg-(--container) border border-(--wrapper) rounded-[0.2rem] shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
               <div className="animate-spin rounded-full h-10 w-10 border-4 border-(--wrapper) border-t-(--header) mb-4"></div>
               <span className="text-muted-foreground text-sm font-medium">กำลังโหลดข้อมูลแดชบอร์ดล่าสุด...</span>
            </div>
          ) : (
            <div className={`flex flex-col gap-6 w-full transition-opacity duration-300 ${isUpdating ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
              {/* ส่วนที่ 1: การแสดงตัวเลขสถิติภาพรวม */}
              <div className="bg-(--container) border border-(--wrapper) rounded-[0.2rem] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
                <span className="font-bold text-lg block mb-4 text-(--header) justify-between">
                  <span>สถิติเบื้องต้น</span>
                  {isUpdating && <span className="text-xs animate-pulse opacity-70 ml-4">กำลังอัปเดต...</span>}
                </span>
                <div className="flex gap-10 flex-wrap">
                  {stats.map((s) => (
                    <div key={s.label} className="flex flex-col">
                      <span className="text-sm font-bold text-stone-600 dark:text-slate-300 mb-1">
                        {s.label}
                      </span>
                      <span className="text-4xl font-black text-(--header)">
                        {Number(s.value).toLocaleString("th-TH")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ส่วนที่ 2: การแสดงผลกราฟ Donut */}
              <div className="bg-(--container) border border-(--wrapper) rounded-[0.2rem] p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
                <span className="font-bold text-lg block mb-6 text-(--header)">
                  กราฟสรุปจำนวนคนทั้งหมด
                </span>
                
                {(!dashboardData || dashboardData.tableData.length === 0) ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground font-medium text-sm">
                    ไม่มีข้อมูลแสดงผลตามสัญชาติหรือวันที่ระบุ
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex xl:flex-row gap-6 xl:gap-4 pb-2 justify-center items-start w-full">
                    {filterType === "illegal" ? (
                      <>
                        {natChart.length > 0 && <DonutChart data={natChart} title="สัญชาติ (Top 6)" />}
                        {victimChart.length > 0 && <DonutChart data={victimChart} title="สถานะผู้เสียหาย" />}
                        {passportChart.length > 0 && <DonutChart data={passportChart} title="สถานะหนังสือเดินทาง" />}
                      </>
                    ) : (
                      <>
                        {channelChart.length > 0 && <DonutChart data={channelChart} title="ช่องทางการส่งกลับ" />}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ส่วนที่ 3: ตารางแสดงผล */}
              <div className="bg-transparent mb-10">
                 <div className="flex justify-between items-center mb-6">
                   <span className="font-bold text-lg text-(--header)">
                     ตารางข้อมูล ({dashboardData?.meta?.totalItems.toLocaleString("th-TH") || 0} รายการ)
                   </span>
                 </div>
                 
                 <div className="bg-(--container) border border-(--wrapper) rounded-[0.2rem] shadow-[4px_4px_0px_rgba(0,0,0,0.25)] overflow-hidden">
                   {filterType === "illegal" ? (
                     <IllegalTable 
                       data={tableRows} 
                       sortField={sortField as IllegalSortField}
                       sortDirection={sortDirection} 
                       onSort={handleSort} 
                     />
                   ) : (
                     <DeportedTable 
                       data={tableRows} 
                       sortField={sortField as DeportedSortField}
                       sortDirection={sortDirection} 
                       onSort={handleSort} 
                     />
                   )}
                 </div>

                 {/* แถบควบคุมเปลี่ยนหน้าเพจ (Pagination) */}
                 {(dashboardData?.meta?.totalPages || 0) > 1 && (() => {
                    const totalPages = dashboardData?.meta?.totalPages || 1;
                    
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
                      <div className="flex flex-col md:flex-row justify-between items-center bg-(--container) p-4 border border-(--wrapper) rounded-[0.2rem] shadow-[4px_4px_0px_rgba(0,0,0,0.25)] mt-6 gap-4">
                        
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-muted-foreground font-medium"><div className="animate-spin rounded-full h-8 w-8 border-4 border-zinc-200 dark:border-zinc-800 border-t-zinc-500 mr-3"></div>กำลังโหลดระบบแดชบอร์ด...</div>}>
      <DashboardContent />
    </Suspense>
  );
}