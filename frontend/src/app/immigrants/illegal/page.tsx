// src/app/immigrants/illegal/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ImmigrantsTable from "@/components/immigrants/ImmigrantsTable";
import { MOCK_ILLEGAL_DATA, DeportedPerson } from "@/components/immigrants/mockData";

export default function IllegalPage() {
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
        // ดึงฟิลด์ฝั่งแอบเข้าเมืองมา mapping ให้ตรงกับโครงสร้างหลัก
        const fetchedRecords = json.data?.illegals;

        if (Array.isArray(fetchedRecords) && fetchedRecords.length > 0) {
          // แปลงฟิลด์จากเบสฝั่งแอบเข้าเมืองให้มาเข้าโครงสร้างตารางเดียวกับคนส่งกลับ
          const mappedData = fetchedRecords.map((item: any) => ({
            id: item.id,
            first_name_th: item.first_name_th,
            last_name_th: item.last_name_th,
            first_name_en: item.first_name_en,
            last_name_en: item.last_name_en,
            date_of_birth: item.detected_date || "ไม่ระบุวันที่พบ", // ฝั่งลอบเข้าใช้ detected_date แทนวันเกิดได้เพื่อให้คอลัมน์ไม่โล่ง
            national_id: item.passport_id || "ไม่มีพาสปอร์ต", // ใช้เลขพาสปอร์ตมาโชว์ในช่องเลขประจำตัว
            address: item.detected_location || "ไม่ระบุสถานที่", // ใช้สถานที่ที่ตรวจพบโชว์ในช่องที่อยู่
          }));
          setData(mappedData);
          setIsUsingMock(false);
        } else {
          setData(MOCK_ILLEGAL_DATA);
          setIsUsingMock(true);
        }
      } catch (err) {
        setData(MOCK_ILLEGAL_DATA);
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
            {"< ลอบเข้า"}
          </Link>
        </div>

        {loading && <div className="text-center py-10 opacity-60">กำลังโหลดข้อมูลระบบ...</div>}
        {!loading && <ImmigrantsTable data={data} isMock={isUsingMock} type="illegal" />}
      </main>
    </div>
  );
}