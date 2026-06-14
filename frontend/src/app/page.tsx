"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ─── คอนสแตนท์สีสำหรับกราฟ ────────────────────────────────────────────────
const CHART_COLORS = [
  "#6B3A3A",
  "#A0522D",
  "#CD853F",
  "#DEB887",
  "#9E7B5A",
  "#8B7355",
];

interface ChartItem {
  name: string;
  value: number;
  color: string;
}

// ─── คอมโพเนนต์กราฟวงกลม Donut Chart (SVG) ───────────────────────────────────
function DonutChart({ data, title }: { data: ChartItem[]; title: string }) {
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
      <p className="text-sm font-semibold" style={{ color: "var(--header)" }}>{title}</p>

      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {slices.map((s, i) => (
          <path key={i} d={arcPath(s.startAngle, s.endAngle)} fill={s.color} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" style={{ color: "var(--header)" }}>
          {total.toLocaleString("th-TH")}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="currentColor" className="opacity-60" style={{ color: "var(--foreground)" }}>
          ทั้งหมด
        </text>
      </svg>

      <div className="flex flex-col gap-1 w-full max-w-45">
        {data.map((d, i) => {
          const pct = ((d.value / total) * 100).toFixed(1);
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="rounded-sm shrink-0 w-2.5 h-2.5" style={{ backgroundColor: d.color }} />
              <span className="truncate flex-1" style={{ color: "var(--foreground)" }}>{d.name}</span>
              <span className="font-mono font-semibold shrink-0" style={{ color: "var(--header)" }}>
                {d.value} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── หน้าเพจหลัก ────────────────────────────────────────────────────────
export default function Home() {
  const [illegalCount, setIllegalCount] = useState<number | null>(null);
  const [deportedCount, setDeportedCount] = useState<number | null>(null);
  const [illegalData, setIllegalData] = useState<any>(null);
  const [deportedData, setDeportedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountsAndCharts = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        
        // ดึง API dashboard ของทั้ง 2 ประเภทมาเลย เพื่อจะได้กราฟสรุป
        const [illegalRes, deportedRes] = await Promise.all([
          fetch(`${backendUrl}/api/v1/dashboard?type=illegal&limit=1`, { cache: "no-store" }),
          fetch(`${backendUrl}/api/v1/dashboard?type=deported&limit=1`, { cache: "no-store" })
        ]);

        if (!illegalRes.ok || !deportedRes.ok) throw new Error("API error");

        const illegalJson = await illegalRes.json();
        const deportedJson = await deportedRes.json();

        setIllegalCount(illegalJson.stats?.total ?? 0);
        setDeportedCount(deportedJson.stats?.total ?? 0);
        
        setIllegalData(illegalJson.charts);
        setDeportedData(deportedJson.charts);
      } catch {
        setIllegalCount(0);
        setDeportedCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchCountsAndCharts();
  }, []);

  const count = (n: number | null) =>
    n === null ? "XX" : n.toLocaleString("th-TH");

  // เตรียมข้อมูลกราฟ (แมปสีใส่ให้ข้อมูล)
  const illegalChart = (illegalData?.nationality || []).map((d: any, i: number) => ({
    ...d,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const deportedChart = (deportedData?.channel || []).map((d: any, i: number) => ({
    ...d,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div
      className="flex flex-1 justify-center items-start gap-6 px-6 py-8 flex-wrap"
      style={{ backgroundColor: "var(--wrapper)" }}
    >
      {/* การ์ด ผู้แอบเข้า */}
      <HomeCard
        title="ผู้แอบเข้า"
        count={count(illegalCount)}
        loading={loading}
        viewAllHref="/immigrants/illegal"
        dashboardHref="/dashboard?type=illegal"
        addHref="/immigrants/illegal/create"
        chartData={illegalChart}
        chartTitle="สัญชาติ (Top 6)"
      />

      {/* การ์ด ผู้ถูกส่งกลับ */}
      <HomeCard
        title="ผู้ถูกส่งกลับ"
        count={count(deportedCount)}
        loading={loading}
        viewAllHref="/immigrants/deported"
        dashboardHref="/dashboard?type=deported"
        addHref="/immigrants/deported/create"
        chartData={deportedChart}
        chartTitle="ช่องทางการส่งกลับ"
      />
    </div>
  );
}

interface HomeCardProps {
  title: string;
  count: string;
  loading: boolean;
  viewAllHref: string;
  dashboardHref: string;
  addHref: string;
  chartData: ChartItem[];
  chartTitle: string;
}

function HomeCard({
  title,
  count,
  loading,
  viewAllHref,
  dashboardHref,
  addHref,
  chartData,
  chartTitle,
}: HomeCardProps) {
  return (
    <div
      className="flex flex-col rounded-2xl shadow-md overflow-hidden"
      style={{
        backgroundColor: "var(--container)",
        border: "1px solid var(--shadow)",
        width: "350px", // ขยายความกว้างการ์ดขึ้นเล็กน้อย เพื่อให้แสดง Label กราฟได้สวยงาม
        minHeight: "560px",
      }}
    >
      {/* Header: ไอคอน + ชื่อ + จำนวน */}
      <div
        className="flex items-center gap-4 px-5 py-4"
        style={{ borderBottom: "1px solid var(--shadow)" }}
      >
        <div
          className="rounded-lg shrink-0 flex items-center justify-center"
          style={{
            width: 80,
            height: 64,
            backgroundColor: "var(--wrapper)",
            border: "1px solid var(--shadow)",
          }}
        >
          <Image
            src="/police.png"
            alt="icon"
            width={40}
            height={40}
            className="opacity-40"
          />
        </div>

        <div className="flex flex-col">
          <span
            className="font-bold leading-tight"
            style={{ color: "var(--header)", fontSize: "1.35rem" }}
          >
            {title}
          </span>
          <span
            className="font-bold"
            style={{ color: "var(--header)", fontSize: "1.15rem" }}
          >
            จำนวน{" "}
            {loading ? (
              <span className="opacity-50">...</span>
            ) : (
              <span>{count}</span>
            )}{" "}
            คน
          </span>
        </div>
      </div>

      {/* ปุ่ม ดูข้อมูลทั้งหมด */}
      <div className="px-5 pt-4">
        <Link href={viewAllHref} className="block w-full">
          <button
            className="w-full py-2 rounded-lg font-medium text-center transition-opacity hover:opacity-80 cursor-pointer"
            style={{
              backgroundColor: "var(--button)",
              border: "1px solid var(--shadow)",
              color: "var(--foreground)",
            }}
          >
            ดูข้อมูลทั้งหมด
          </button>
        </Link>
      </div>

      {/* ปุ่ม แดชบอร์ด */}
      <div className="px-5 pt-2">
        <Link href={dashboardHref} className="block w-full">
          <button
            className="w-full py-2 rounded-lg font-medium text-center transition-opacity hover:opacity-80 cursor-pointer"
            style={{
              backgroundColor: "var(--button)",
              border: "1px solid var(--shadow)",
              color: "var(--foreground)",
            }}
          >
            แดชบอร์ด
          </button>
        </Link>
      </div>

      <div
        className="mx-5 mt-4"
        style={{ borderBottom: "1px solid var(--shadow)" }}
      />

      {/* ส่วนแสดง Chart ที่เพิ่มเข้ามาแทนวงกลมเปล่า */}
      <div className="flex flex-1 items-center justify-center px-5 py-6">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-32 h-32 bg-stone-200 dark:bg-stone-800 rounded-full" />
            <div className="w-24 h-4 bg-stone-200 dark:bg-stone-800 rounded-md" />
          </div>
        ) : chartData && chartData.length > 0 ? (
          <DonutChart data={chartData} title={chartTitle} />
        ) : (
          <div
            className="rounded-full flex items-center justify-center font-medium"
            style={{
              width: 180,
              height: 180,
              border: "24px solid var(--wrapper)",
              backgroundColor: "var(--container)",
              color: "var(--foreground)",
            }}
          >
            ไม่มีข้อมูล
          </div>
        )}
      </div>

      <div
        className="mx-5"
        style={{ borderBottom: "1px solid var(--shadow)" }}
      />

      {/* ปุ่ม เพิ่มข้อมูล */}
      <div className="px-5 py-4">
        <Link href={addHref} className="block w-full">
          <button
            className="w-full py-2 rounded-lg font-medium text-center transition-opacity hover:opacity-80 cursor-pointer"
            style={{
              backgroundColor: "var(--button)",
              border: "1px solid var(--shadow)",
              color: "var(--foreground)",
            }}
          >
            เพิ่มข้อมูล
          </button>
        </Link>
      </div>
    </div>
  );
}