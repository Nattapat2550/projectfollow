"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import UniversalImmigrantCard from "@/components/immigrants/UniversalImmigrantCard";
import RightPanel from "@/components/immigrants/RightPanel";
import ImmigrantEditForm from "@/components/immigrants/ImmigrantEditForm";
import { useImmigrantDetail } from "@/hooks/useImmigrantDetail";

export default function ImmigrantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { states, actions, handlers } = useImmigrantDetail(id);

  if (states.loading) return <div className="flex h-screen items-center justify-center">กำลังโหลดข้อมูล...</div>;

  if (!states.person || !states.personType) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-xl font-bold text-red-500">ไม่พบข้อมูล ID: "{id}"</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md">ย้อนกลับ</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-200">
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => states.isEditing ? actions.setIsEditing(false) : router.back()}
          className="flex items-center gap-1 text-2xl font-bold text-(--header) hover:opacity-80 transition cursor-pointer"
        >
          <ChevronLeft size={32} />
          <span>{states.isEditing ? `แก้ไขฟอร์ม` : `รายละเอียด`}</span>
        </button>
      </div>

      {states.isEditing ? (
        <ImmigrantEditForm 
          id={id}
          personType={states.personType as "illegal" | "repatriated"}
          onCancel={() => actions.setIsEditing(false)}
          initialData={states.person}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
          <div className="lg:col-span-7 xl:col-span-8 w-full">
            <UniversalImmigrantCard data={states.person} type={states.personType as "illegal" | "repatriated"} />
          </div>
          <div className="lg:col-span-5 xl:col-span-4 w-full">
            <RightPanel type={states.personType} data={states.person} note={states.note} setNote={actions.setNote} onEditClick={() => actions.setIsEditing(true)} />
          </div>
        </div>
      )}
    </div>
  );
}