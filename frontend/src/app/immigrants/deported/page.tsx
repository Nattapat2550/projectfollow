"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImmigrantsTable from "@/components/immigrants/ImmigrantsTable";

export default function DeportedPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-4xl font-bold transition-opacity hover:opacity-80 flex items-center gap-2" style={{ color: "var(--header)" }}>
            {"< ส่งกลับ"}
          </Link>
        </div>

        {loading && <div className="text-center py-10 opacity-60">กำลังโหลดข้อมูลระบบ...</div>}
        {!loading && <ImmigrantsTable data={data} isMock={false} type="deported" />}
      </main>
    </div>
  );
}