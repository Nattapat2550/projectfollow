"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ImmigrantsTable from "@/components/immigrants/ImmigrantsTable";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: number | string;
}

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

// ─── Colours ─────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#6B3A3A",
  "#A0522D",
  "#CD853F",
  "#DEB887",
  "#9E7B5A",
  "#8B7355",
];

// ─── Helpers สำหรับกราฟ ────────────────────────────────────────────────────────

function getTopNationalities(data: any[]): ChartItem[] {
  const counts: Record<string, number> = {};
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const nat = item.nationality || "ไม่ระบุ";
    counts[nat] = (counts[nat] || 0) + 1;
  }
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

function getChannelSplit(data: any[]): ChartItem[] {
  const counts: Record<string, number> = {};
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const c = item.channel || "ไม่ระบุช่องทาง";
    counts[c] = (counts[c] || 0) + 1;
  }
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
}

function getVictimSplit(data: any[]): ChartItem[] {
  let victim = 0;
  let nonVictim = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (data[i].is_victim) {
      victim++;
    } else {
      nonVictim++;
    }
  }
  
  const result: ChartItem[] = [];
  if (victim) result.push({ name: "เป็นผู้เสียหาย", value: victim, color: CHART_COLORS[0] });
  if (nonVictim) result.push({ name: "ไม่เป็นผู้เสียหาย", value: nonVictim, color: CHART_COLORS[2] });
  return result;
}

function getPassportSplit(data: any[]): ChartItem[] {
  let hasPassport = 0;
  let noPassport = 0;
  const noKeywords = ["-", "ไม่มี", "ไม่ระบุ", "none", "n/a", "null", "ไม่มีหนังสือเดินทาง"];

  for (let i = 0; i < data.length; i++) {
    const p = data[i].passport_id ? data[i].passport_id.trim().toLowerCase() : "";
    if (p && !noKeywords.includes(p)) {
      hasPassport++;
    } else {
      noPassport++;
    }
  }
  
  const result: ChartItem[] = [];
  if (hasPassport) result.push({ name: "มีหนังสือเดินทาง", value: hasPassport, color: CHART_COLORS[1] });
  if (noPassport) result.push({ name: "ไม่มีข้อมูล / ไม่มี", value: noPassport, color: CHART_COLORS[3] });
  return result;
}

// ─── SVG Donut Chart Component ──────────────────────────────────────────────

function DonutChart({ data, title }: { data: ChartItem[]; title: string; }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const SIZE = 180;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 70;
  const r = 42;

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
    <div className="flex flex-col items-center gap-3 flex-1 min-w-50">
      <p className="text-sm font-semibold text-(--header)">{title}</p>

      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {slices.map((s, i) => (
          <path key={i} d={arcPath(s.startAngle, s.endAngle)} fill={s.color} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" className="text-(--header)">
          {total.toLocaleString("th-TH")}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="currentColor" className="text-muted-foreground">
          ทั้งหมด
        </text>
      </svg>

      <div className="flex flex-col gap-1 w-full max-w-45">
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

// ─── Dashboard Content ───────────────────────────────────────────────────────

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeParam = (searchParams.get("type") as "illegal" | "deported") || "illegal";

  const [allData, setAllData] = useState<{ illegals: any[]; deporteds: any[] }>({ illegals: [], deporteds: [] });
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<"illegal" | "deported">(typeParam);
  const [filterNat, setFilterNat] = useState<string>("ทั้งหมด");
  const [filterGender, setFilterGender] = useState<string>("ทั้งหมด");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // ระบบ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/v1/immigrants`, { cache: "no-store" });
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        setAllData({
          illegals: json.data?.illegals || [],
          deporteds: json.data?.deporteds || [],
        });
      } catch {
        setAllData({ illegals: [], deporteds: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setFilterType(typeParam);
  }, [typeParam]);

  // รีเซ็ตหน้ากลับไปเป็นหน้าแรกเสมอเมื่อตัวกรองเปลี่ยน
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterNat, filterGender, startDate, endDate]);

  const rawData = filterType === "illegal" ? allData.illegals : allData.deporteds;

  const allNats = ["ทั้งหมด", ...Array.from(new Set(rawData.map((d: any) => d.nationality || "ไม่ระบุ"))).sort()] as string[];
  const allGenders = ["ทั้งหมด", ...Array.from(new Set(rawData.map((d: any) => d.gender || "ไม่ระบุ"))).sort()] as string[];

  // 1. กรองข้อมูลตามฟิลเตอร์
  const filteredData = rawData.filter((item) => {
    const natMatch = filterNat === "ทั้งหมด" || (item.nationality || "ไม่ระบุ") === filterNat;
    const genderMatch = filterGender === "ทั้งหมด" || (item.gender || "ไม่ระบุ") === filterGender;

    let dateMatch = true;
    if (startDate || endDate) {
      const dateStr = filterType === "illegal" ? item.detected_date : item.return_date;
      if (!dateStr) {
        dateMatch = false;
      } else {
        const itemDate = new Date(dateStr).getTime();
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).getTime() + 86400000 - 1 : Infinity;
        dateMatch = itemDate >= start && itemDate <= end;
      }
    }
    
    return natMatch && genderMatch && dateMatch;
  });

  // 2. แมพข้อมูลให้ตรงกับ ImmigrantsTable (เฉพาะประเภทแอบเข้าเมืองที่ต้องการการแปลงชื่อฟิลด์)
  const mappedTableData = filteredData.map((item: any) => {
    if (filterType === "illegal") {
      return {
        ...item,
        date_of_birth: item.detected_date ? new Date(item.detected_date).toLocaleDateString('th-TH') : "ไม่ระบุวันที่พบ",
        national_id: item.passport_id || "ไม่มีพาสปอร์ต",
        address: item.detected_location || "ไม่ระบุสถานที่",
      };
    }
    return item;
  });

  // 3. หั่นข้อมูลตามหน้าปัจจุบัน
  const totalPages = Math.ceil(mappedTableData.length / itemsPerPage);
  const paginatedData = mappedTableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats: StatItem[] = (() => {
    if (filterType === "illegal") {
      const victims = filteredData.filter((d) => d.is_victim).length;
      return [
        { label: "จำนวนทั้งหมด", value: filteredData.length },
        { label: "ผู้เสียหาย (ค้ามนุษย์)", value: victims },
      ];
    } else {
      const success = filteredData.filter((d) => d.result === "SUCCESS").length;
      return [
        { label: "จำนวนทั้งหมด", value: filteredData.length },
        { label: "ส่งกลับสำเร็จ", value: success },
      ];
    }
  })();

  const victimChart = getVictimSplit(filteredData);
  const passportChart = getPassportSplit(filteredData);
  const channelChart = getChannelSplit(filteredData);
  const natChart = getTopNationalities(filteredData);

  const inputClass = "w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40";

  return (
    <div className="min-h-screen p-6 bg-background text-foreground transition-colors duration-200">
      
      {/* Header */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 font-bold mb-6 hover:opacity-80 transition text-(--header) text-2xl"
      >
        {"< แดชบอร์ด"}
      </Link>

      <div className="flex flex-col lg:flex-row gap-6 items-start max-w-7xl mx-auto">
        
        {/* ── ซ้าย: Filters ──────────────────────────── */}
        <div className="bg-(--container) border border-(--wrapper) rounded-2xl p-6 shadow-sm shrink-0 flex flex-col gap-5 w-full lg:w-72">
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
                setStartDate("");
                setEndDate("");
                router.replace(`/dashboard?type=${val}`);
              }}
              className={inputClass}
            >
              <option value="illegal">ผู้แอบเข้า (Illegal)</option>
              <option value="deported">ผู้ถูกส่งกลับ (Deported)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-stone-600 dark:text-slate-300">สัญชาติ</label>
            <select
              value={filterNat}
              onChange={(e) => setFilterNat(e.target.value)}
              className={inputClass}
            >
              {allNats.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-stone-600 dark:text-slate-300">เพศ</label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className={inputClass}
            >
              {allGenders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-stone-600 dark:text-slate-300">ตั้งแต่วันที่</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-stone-600 dark:text-slate-300">ถึงวันที่</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            onClick={() => {
              setFilterNat("ทั้งหมด");
              setFilterGender("ทั้งหมด");
              setStartDate("");
              setEndDate("");
            }}
            className="mt-2 w-full py-2 bg-stone-200 dark:bg-stone-800 text-foreground font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition text-sm cursor-pointer"
          >
            รีเซ็ตทั้งหมด
          </button>
        </div>

        {/* ── ขวา: Stats + Chart + Table ──────────────────────── */}
        <div className="flex flex-col gap-6 flex-1 min-w-0 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 bg-(--container) border border-(--wrapper) rounded-2xl shadow-sm">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-(--header) mb-4"></div>
               <span className="text-muted-foreground text-sm font-medium">กำลังโหลดข้อมูลทั้งหมด...</span>
            </div>
          ) : (
            <>
              {/* Stats box */}
              <div className="bg-(--container) border border-(--wrapper) rounded-2xl p-6 shadow-sm">
                <span className="font-bold text-lg block mb-4 text-(--header)">
                  สถิติเบื้องต้น
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

              {/* Chart box */}
              <div className="bg-(--container) border border-(--wrapper) rounded-2xl p-6 shadow-sm">
                <span className="font-bold text-lg block mb-6 text-(--header)">
                  กราฟสรุปจำนวนคนทั้งหมด
                </span>
                
                {filteredData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground font-medium text-sm">
                    ไม่มีข้อมูลในช่วงเวลานี้
                  </div>
                ) : (
                  <div className="flex gap-8 flex-wrap justify-center">
                    {filterType === "illegal" ? (
                      <>
                        <DonutChart data={natChart} title="สัญชาติ (Top 6)" />
                        <DonutChart data={victimChart} title="สถานะผู้เสียหาย" />
                        <DonutChart data={passportChart} title="สถานะหนังสือเดินทาง" />
                      </>
                    ) : (
                      <DonutChart data={channelChart} title="ช่องทางการส่งกลับ" />
                    )}
                  </div>
                )}
              </div>

              {/* Data Table Area - ใช้ตารางหลักของคุณ (ImmigrantsTable) */}
              <div className="bg-transparent mb-10">
                 <div className="flex justify-between items-center mb-6">
                   <span className="font-bold text-lg text-(--header)">
                     ตารางข้อมูล ({filteredData.length.toLocaleString("th-TH")} รายการ)
                   </span>
                 </div>
                 
                 <ImmigrantsTable data={paginatedData} isMock={false} type={filterType} />

                 {/* ระบบ Pagination แบบเดียวกับหน้า Illegal/Deported */}
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
                        หน้า {currentPage} จาก {totalPages} (ทั้งหมด {mappedTableData.length} รายการ)
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-muted-foreground font-medium">กำลังโหลดระบบแดชบอร์ด...</div>}>
      <DashboardContent />
    </Suspense>
  );
}