"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { 
  MOCK_DEPORTED_DATA, 
  MOCK_ILLEGAL_DATA, 
  DeportedPerson, 
  IllegalImmigrant 
} from "@/components/immigrants/mockData";
import DeportedCard from "@/components/immigrants/DeportedCard";
import IllegalCard from "@/components/immigrants/IllegalCard";
import RightPanel from "@/components/immigrants/RightPanel";

type PersonData = DeportedPerson | IllegalImmigrant;

export default function ImmigrantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [person, setPerson] = useState<PersonData | null>(null);
  const [personType, setPersonType] = useState<"deported" | "illegal" | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    // ค้นหาในกลุ่ม Deported ก่อน
    const foundDep = MOCK_DEPORTED_DATA.find((p) => p.id === id);
    if (foundDep) {
      setPerson(foundDep);
      setPersonType("deported");
    } else {
      // ถ้าไม่เจอ ค่อยไปหาในกลุ่ม Illegal
      const foundIll = MOCK_ILLEGAL_DATA.find((p) => p.id === id);
      if (foundIll) {
        setPerson(foundIll);
        setPersonType("illegal");
      } else {
        // หาไม่เจอทั้ง 2 กลุ่ม
        setPerson(null);
        setPersonType(null);
      }
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // แสดงหน้า Not Found หากค้นหาข้อมูลไม่พบ
  if (!person || !personType) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] gap-4">
        <p className="text-xl font-bold text-red-500">ไม่พบข้อมูล ID: "{id}" ในสารบบ Mock Data</p>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-200 text-slate-800 border border-slate-300 rounded-md hover:opacity-80 cursor-pointer"
        >
          ย้อนกลับ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 text-[var(--foreground)] transition-colors duration-200">
      {/* ปุ่มย้อนกลับด้านบน */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-2xl font-bold text-[var(--header)] hover:opacity-80 transition cursor-pointer"
        >
          <ChevronLeft size={32} />
          <span>รายละเอียด ({personType === "deported" ? "ผู้ถูกส่งตัวกลับ" : "ผู้แอบเข้าประเทศ"})</span>
        </button>
      </div>

      {/* Grid Layout สลับ Component การ์ดตามรูปภาพและประเภทข้อมูล */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
        {/* ฝั่งซ้าย: แสดงข้อมูลหน้าบัตร */}
        <div className="lg:col-span-7 xl:col-span-8 w-full">
          {personType === "deported" ? (
            <DeportedCard data={person as DeportedPerson} />
          ) : (
            <IllegalCard data={person as IllegalImmigrant} />
          )}
        </div>

        {/* ฝั่งขวา: แสดงข้อมูลสถานะ/คัดกรอง + หมายเหตุ + ปุ่มคำสั่ง */}
        <div className="lg:col-span-5 xl:col-span-4 w-full">
          <RightPanel type={personType} data={person} note={note} setNote={setNote} />
        </div>
      </div>
    </div>
  );
}