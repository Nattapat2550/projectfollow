"use client";

import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";

type SortField = "name" | "nationality" | "detected_date" | "detected_location" | "is_victim";

interface IllegalTableProps {
  data: any[];
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: SortField) => void;
}

export default function IllegalTable({ data, sortField, sortDirection, onSort }: IllegalTableProps) {
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
            <Th field="nationality">สัญชาติ</Th>
            <Th field="detected_date">วันที่ตรวจพบ</Th>
            <Th field="detected_location">สถานที่ตรวจพบ</Th>
            <Th field="is_victim">สถานะผู้เสียหาย</Th>
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
              <td className="p-3">{person.nationality || "ไม่ระบุ"}</td>
              <td className="p-3">{person.detected_date ? new Date(person.detected_date).toLocaleDateString('th-TH') : "ไม่ระบุ"}</td>
              <td className="p-3 max-w-62.5 truncate">{person.detected_location || "ไม่ระบุสถานที่"}</td>
              <td className="p-3">{person.is_victim ? "เป็นผู้เสียหาย" : "ไม่ใช่"}</td>
            </tr>
          )) : (
            <tr><td colSpan={5} className="p-8 text-center">ไม่พบข้อมูล</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}