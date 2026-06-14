"use client";

import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortField = "name" | "date_of_birth" | "national_id" | "address" | "return_date" | "result";

interface DeportedTableProps {
  data: any[];
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: SortField) => void;
}

export default function DeportedTable({ data, sortField, sortDirection, onSort }: DeportedTableProps) {
  const router = useRouter();

  const Th = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th onClick={() => onSort(field)} className="p-3 font-bold cursor-pointer select-none whitespace-nowrap">
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : <span className="w-4 h-4 text-transparent inline-block">↕</span>}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto border rounded-sm" style={{ borderColor: "var(--foreground)" }}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <Th field="name">ชื่อ - นามสกุล</Th>
            <Th field="date_of_birth">วันเกิด / อายุ</Th>
            <Th field="national_id">เลขประจำตัว</Th>
            <Th field="address">สถานที่</Th>
            <Th field="return_date">วันที่ส่งกลับ</Th>
            <Th field="result">สถานะ</Th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "var(--foreground)" }}>
          {data.length > 0 ? data.map((person) => (
            <tr 
              key={person.id} 
              onClick={() => router.push(`/immigrants/${person.id}`)}
              className="hover:bg-muted/30 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            >
              <td className="p-3">{person.first_name_th} {person.last_name_th}</td>
              <td className="p-3">{person.date_of_birth || "ไม่ระบุ"} {person.age ? `(${person.age} ปี)` : ""}</td>
              <td className="p-3">{person.national_id || person.passport_id || "ไม่ระบุ"}</td>
              <td className="p-3 max-w-62.5 truncate">{person.address || "ไม่ระบุสถานที่"}</td>
              <td className="p-3">{person.return_date ? new Date(person.return_date).toLocaleDateString('th-TH') : "รอการส่งกลับ"}</td>
              <td className="p-3 font-medium">
                 {person.result === "SUCCESS" && <span className="text-emerald-500">สำเร็จ</span>}
                 {person.result === "FAILED" && <span className="text-red-500">ล้มเหลว</span>}
                 {(!person.result || person.result === "PENDING") && <span className="text-amber-500">รอดำเนินการ</span>}
              </td>
            </tr>
          )) : (
            <tr><td colSpan={6} className="p-8 text-center">ไม่พบข้อมูล</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}