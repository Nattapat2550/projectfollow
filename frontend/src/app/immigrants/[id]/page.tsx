"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import DeportedCard from "@/components/immigrants/DeportedCard";
import IllegalCard from "@/components/immigrants/IllegalCard";
import RightPanel from "@/components/immigrants/RightPanel";

export default function ImmigrantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [person, setPerson] = useState<any | null>(null);
  const [personType, setPersonType] = useState<"deported" | "illegal" | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/api/v1/immigrants`);
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();

        const deporteds = json.data?.deporteds || [];
        const illegals = json.data?.illegals || [];

        // 1. หาในฝั่งส่งกลับก่อน
        const foundDep = deporteds.find((p: any) => p.id === id);
        if (foundDep) {
          setPerson(foundDep);
          setPersonType("deported");
          setNote(foundDep.note || "");
        } else {
          // 2. ถ้าไม่เจอ ไปหาในฝั่งลอบเข้า
          const foundIll = illegals.find((p: any) => p.id === id);
          if (foundIll) {
            setPerson(foundIll);
            setPersonType("illegal");
            setNote(foundIll.note || "");
          } else {
            setPerson(null);
            setPersonType(null);
          }
        }
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!person || !personType) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground gap-4">
        <p className="text-xl font-bold text-red-500">ไม่พบข้อมูล ID: "{id}" ในฐานข้อมูล</p>
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
    <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-200">
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-2xl font-bold text-(--header) hover:opacity-80 transition cursor-pointer"
        >
          <ChevronLeft size={32} />
          <span>รายละเอียด ({personType === "deported" ? "ผู้ถูกส่งตัวกลับ" : "ผู้แอบเข้าประเทศ"})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
        <div className="lg:col-span-7 xl:col-span-8 w-full">
          {personType === "deported" ? (
            <DeportedCard data={person} />
          ) : (
            <IllegalCard data={person} />
          )}
        </div>

        <div className="lg:col-span-5 xl:col-span-4 w-full">
          <RightPanel type={personType} data={person} note={note} setNote={setNote} />
        </div>
      </div>
    </div>
  );
}