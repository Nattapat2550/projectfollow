// src/app/immigrants/deported/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImmigrantsTable from "@/components/immigrants/ImmigrantsTable";
import { MOCK_DEPORTED_DATA, DeportedPerson } from "@/components/immigrants/mockData";

export default function DeportedPage() {
  const [data, setData] = useState<DeportedPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUsingMock, setIsUsingMock] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/immigrants");
        if (!res.ok) throw new Error("API error");
        
        const json = await res.json();
        const fetchedRecords = json.data?.deporteds;

        if (Array.isArray(fetchedRecords) && fetchedRecords.length > 0) {
          setData(fetchedRecords);
          setIsUsingMock(false);
        } else {
          setData(MOCK_DEPORTED_DATA);
          setIsUsingMock(true);
        }
      } catch (err) {
        setData(MOCK_DEPORTED_DATA);
        setIsUsingMock(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold transition-opacity hover:opacity-80 flex items-center gap-2" style={{ color: "var(--header)" }}>
            {"< ส่งกลับ"}
          </Link>
        </div>

        {loading && <div className="text-center py-10 opacity-60">กำลังโหลดข้อมูลระบบ...</div>}
        {!loading && <ImmigrantsTable data={data} isMock={isUsingMock} type="deported" />}
      </main>
    </div>
  );
}