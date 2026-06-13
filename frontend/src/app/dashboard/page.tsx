"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTopNationalities(data: any[]): ChartItem[] {
  const counts: Record<string, number> = {};
  for (const item of data) {
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

function getGenderSplit(data: any[]): ChartItem[] {
  let male = 0;
  let female = 0;
  let other = 0;
  for (const item of data) {
    const g = (item.gender || "").toLowerCase();
    if (g === "ชาย" || g === "male") male++;
    else if (g === "หญิง" || g === "female") female++;
    else other++;
  }
  const result: ChartItem[] = [];
  if (male) result.push({ name: "ชาย", value: male, color: CHART_COLORS[0] });
  if (female) result.push({ name: "หญิง", value: female, color: CHART_COLORS[1] });
  if (other) result.push({ name: "อื่นๆ", value: other, color: CHART_COLORS[2] });
  return result;
}

// ─── SVG Donut Chart (ไม่ใช้ library ภายนอก) ─────────────────────────────────

function DonutChart({
  data,
  title,
}: {
  data: ChartItem[];
  title: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const SIZE = 180;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 70;
  const r = 42;

  // Build arc paths
  let cumulative = 0;
  const slices = data.map((d) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += d.value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
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
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--header)" }}
      >
        {title}
      </p>

      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {slices.map((s, i) => (
          <path key={i} d={arcPath(s.startAngle, s.endAngle)} fill={s.color} />
        ))}
        {/* centre label */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill="var(--header)"
        >
          {total.toLocaleString("th-TH")}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fontSize="10"
          fill="var(--foreground)"
          opacity={0.6}
        >
          ทั้งหมด
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-1 w-full max-w-45">
        {data.map((d, i) => {
          const pct = ((d.value / total) * 100).toFixed(1);
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span
                className="rounded-sm shrink-0"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: d.color,
                }}
              />
              <span
                className="truncate flex-1"
                style={{ color: "var(--foreground)" }}
              >
                {d.name}
              </span>
              <span
                className="font-mono font-semibold shrink-0"
                style={{ color: "var(--header)" }}
              >
                {pct}%
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
  const typeParam =
    (searchParams.get("type") as "illegal" | "deported") || "illegal";

  const [allData, setAllData] = useState<{
    illegals: any[];
    deporteds: any[];
  }>({ illegals: [], deporteds: [] });
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<"illegal" | "deported">(
    typeParam
  );
  const [filterNat, setFilterNat] = useState<string>("ทั้งหมด");
  const [filterGender, setFilterGender] = useState<string>("ทั้งหมด");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/v1/immigrants`, {
          cache: "no-store",
        });
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

  const rawData =
    filterType === "illegal" ? allData.illegals : allData.deporteds;

  const filteredData = rawData.filter((item) => {
    const natMatch =
      filterNat === "ทั้งหมด" ||
      (item.nationality || "ไม่ระบุ") === filterNat;
    const genderMatch =
      filterGender === "ทั้งหมด" ||
      (item.gender || "ไม่ระบุ") === filterGender;
    return natMatch && genderMatch;
  });

  const stats: StatItem[] = (() => {
    if (filterType === "illegal") {
      const victims = filteredData.filter((d) => d.is_victim).length;
      const nats = new Set(
        filteredData.map((d) => d.nationality || "ไม่ระบุ")
      ).size;
      return [
        { label: "จำนวนทั้งหมด", value: filteredData.length },
        { label: "ผู้เสียหาย (ค้ามนุษย์)", value: victims },
        { label: "จำนวนสัญชาติ", value: nats },
      ];
    } else {
      const success = filteredData.filter((d) => d.result === "SUCCESS").length;
      const warranted = filteredData.filter(
        (d) => (d.number_of_warrant || 0) > 0
      ).length;
      return [
        { label: "จำนวนทั้งหมด", value: filteredData.length },
        { label: "ส่งกลับสำเร็จ", value: success },
        { label: "มีหมายจับ", value: warranted },
      ];
    }
  })();

  const nationalityChart = getTopNationalities(filteredData);
  const genderChart = getGenderSplit(filteredData);

  const allNats = [
    "ทั้งหมด",
    ...Array.from(
      new Set(rawData.map((d: any) => d.nationality || "ไม่ระบุ"))
    ).sort(),
  ];
  const allGenders = [
    "ทั้งหมด",
    ...Array.from(
      new Set(rawData.map((d: any) => d.gender || "ไม่ระบุ"))
    ).sort(),
  ];

  // shared select style
  const selectStyle: React.CSSProperties = {
    backgroundColor: "var(--button)",
    border: "1px solid var(--shadow)",
    color: "var(--foreground)",
  };

  return (
    <div
      className="min-h-screen px-6 py-6"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 font-bold mb-6 transition-opacity hover:opacity-70"
        style={{ color: "var(--header)", fontSize: "1.6rem" }}
      >
        {"< แดชบอร์ด"}
      </Link>

      <div className="flex gap-4 items-start">
        {/* ── ซ้าย: Filters ──────────────────────────── */}
        <div
          className="rounded-2xl p-4 shrink-0 flex flex-col gap-3"
          style={{
            width: 220,
            minHeight: 480,
            backgroundColor: "var(--container)",
            border: "1px solid var(--shadow)",
          }}
        >
          <span
            className="font-bold text-base"
            style={{ color: "var(--header)" }}
          >
            พวกฟิลเตอร์ตัวเลือก
          </span>

          {/* ประเภทข้อมูล */}
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              ประเภทข้อมูล
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                const val = e.target.value as "illegal" | "deported";
                setFilterType(val);
                setFilterNat("ทั้งหมด");
                setFilterGender("ทั้งหมด");
                router.replace(`/dashboard?type=${val}`);
              }}
              className="w-full rounded-lg px-3 py-1.5 text-sm font-medium outline-none cursor-pointer"
              style={selectStyle}
            >
              <option value="illegal">ผู้แอบเข้า</option>
              <option value="deported">ผู้ถูกส่งกลับ</option>
            </select>
          </div>

          {/* สัญชาติ */}
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              สัญชาติ
            </label>
            <select
              value={filterNat}
              onChange={(e) => setFilterNat(e.target.value)}
              className="w-full rounded-lg px-3 py-1.5 text-sm font-medium outline-none cursor-pointer"
              style={selectStyle}
            >
              {allNats.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* เพศ */}
          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              เพศ
            </label>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full rounded-lg px-3 py-1.5 text-sm font-medium outline-none cursor-pointer"
              style={selectStyle}
            >
              {allGenders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={() => {
              setFilterNat("ทั้งหมด");
              setFilterGender("ทั้งหมด");
            }}
            className="mt-auto w-full py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-70 cursor-pointer"
            style={selectStyle}
          >
            รีเซ็ตฟิลเตอร์
          </button>
        </div>

        {/* ── ขวา: Stats + Chart ──────────────────────── */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {/* Stats box */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--container)",
              border: "1px solid var(--shadow)",
              minHeight: 120,
            }}
          >
            <span
              className="font-bold text-base block mb-3"
              style={{ color: "var(--header)" }}
            >
              ข้อมูลตัวเลขต่างๆ
            </span>

            {loading ? (
              <div className="opacity-50 text-sm">กำลังโหลด...</div>
            ) : (
              <div className="flex gap-8 flex-wrap">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--foreground)", opacity: 0.65 }}
                    >
                      {s.label}
                    </span>
                    <span
                      className="text-3xl font-bold"
                      style={{ color: "var(--header)" }}
                    >
                      {Number(s.value).toLocaleString("th-TH")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart box */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: "var(--container)",
              border: "1px solid var(--shadow)",
              minHeight: 320,
            }}
          >
            <span
              className="font-bold text-base block mb-4"
              style={{ color: "var(--header)" }}
            >
              กราฟแสดงข้อมูล
            </span>

            {loading ? (
              <div className="flex items-center justify-center h-48 opacity-50 text-sm">
                กำลังโหลด...
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex items-center justify-center h-48 opacity-40 text-sm">
                ไม่มีข้อมูล
              </div>
            ) : (
              <div className="flex gap-8 flex-wrap justify-center">
                {nationalityChart.length > 0 && (
                  <DonutChart
                    data={nationalityChart}
                    title={`สัญชาติ (Top ${nationalityChart.length})`}
                  />
                )}
                {genderChart.length > 0 && (
                  <DonutChart data={genderChart} title="เพศ" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen opacity-50">
          กำลังโหลด...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}