"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [illegalCount, setIllegalCount] = useState<number | null>(null);
  const [deportedCount, setDeportedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/v1/immigrants`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("API error");
        const json = await res.json();
        setIllegalCount(json.data?.illegals?.length ?? 0);
        setDeportedCount(json.data?.deporteds?.length ?? 0);
      } catch {
        setIllegalCount(0);
        setDeportedCount(0);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const count = (n: number | null) =>
    n === null ? "XX" : n.toLocaleString("th-TH");

  return (
    <div
      className="flex flex-1 justify-center items-start gap-6 px-6 py-8"
      style={{ backgroundColor: "var(--wrapper)" }}
    >
      {/* การ์ด ผู้แอบเข้า */}
      <HomeCard
        title="ผู้แอบเข้า"
        count={count(illegalCount)}
        loading={loading}
        viewAllHref="/immigrants/illegal"
        dashboardHref="/dashboard?type=illegal"
        addHref="/immigrant/create"
      />

      {/* การ์ด ผู้ถูกส่งกลับ */}
      <HomeCard
        title="ผู้ถูกส่งกลับ"
        count={count(deportedCount)}
        loading={loading}
        viewAllHref="/immigrants/deported"
        dashboardHref="/dashboard?type=deported"
        addHref="/deport/create"
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
}

function HomeCard({
  title,
  count,
  loading,
  viewAllHref,
  dashboardHref,
  addHref,
}: HomeCardProps) {
  return (
    <div
      className="flex flex-col rounded-2xl shadow-md overflow-hidden"
      style={{
        backgroundColor: "var(--container)",
        border: "1px solid var(--shadow)",
        width: "320px",
        minHeight: "560px",
      }}
    >
      {/* Header: ไอคอน + ชื่อ + จำนวน */}
      <div
        className="flex items-center gap-4 px-5 py-4"
        style={{ borderBottom: "1px solid var(--shadow)" }}
      >
        {/* Icon placeholder */}
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

        {/* Title + count */}
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

      {/* Divider */}
      <div
        className="mx-5 mt-4"
        style={{
          borderBottom: "1px solid var(--shadow)",
        }}
      />

      {/* Chart placeholder - วงกลม */}
      <div className="flex flex-1 items-center justify-center px-5 py-6">
        <div
          className="rounded-full"
          style={{
            width: 180,
            height: 180,
            border: "24px solid var(--wrapper)",
            backgroundColor: "var(--container)",
          }}
        />
      </div>

      {/* Divider */}
      <div
        className="mx-5"
        style={{
          borderBottom: "1px solid var(--shadow)",
        }}
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