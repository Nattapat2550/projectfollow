// src/components/immigrants/TableRow.tsx
"use client";

import { useRouter } from "next/navigation";
import { DeportedPerson } from "./mockData";

interface TableRowProps {
  person: DeportedPerson;
  isMock: boolean;
  type: "deported" | "illegal"; // รับ type เพื่อแยกค่า ID ตอนกดข้อมูลจำลอง
}

export default function TableRow({ person, isMock, type }: TableRowProps) {
  const router = useRouter();

  const fullName = [
    person.first_name_th || person.first_name_en, 
    person.last_name_th || person.last_name_en
  ].filter(Boolean).join(" ");

  // 🎯 กำหนด URL เงื่อนไขของ Mock: deport -> -1, illegal -> -2 ถ้าของจริงใช้ ID จริงจากเบส
  let detailUrl = `/immigrants/${person.id}`;
  if (isMock) {
    detailUrl = type === "deported" ? "/immigrants/-1" : "/immigrants/-2";
  }

  return (
    <tr 
      onClick={() => router.push(detailUrl)}
      className="transition-colors hover:bg-[var(--row-hover)] cursor-pointer"
      style={{ borderBottomColor: "var(--foreground)" }}
    >
      <td className="py-3 px-4 text-sm border-r font-medium" style={{ borderColor: "var(--foreground)" }}>
        {fullName || "ไม่ระบุชื่อ"}
      </td>
      <td className="py-3 px-4 text-sm border-r" style={{ borderColor: "var(--foreground)" }}>
        {person.date_of_birth || "ไม่ระบุ"}
      </td>
      <td className="py-3 px-4 text-sm border-r" style={{ borderColor: "var(--foreground)" }}>
        {person.national_id || "ไม่ระบุ"}
      </td>
      <td className="py-3 px-4 text-sm whitespace-pre-line">
        {person.address}
      </td>
    </tr>
  );
}