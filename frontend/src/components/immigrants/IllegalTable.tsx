"use client";

import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

// ✨ แก้ตรงนี้: เพิ่มคำว่า export เข้าไป
export type SortField = "name" | "nationality" | "detected_date" | "detected_location" | "is_victim";

interface IllegalTableProps {
  data: any[];
  sortField: SortField | null;
  sortDirection: "asc" | "desc";
  onSort: (field: SortField) => void;
}

export default function IllegalTable({ data, sortField, sortDirection, onSort }: IllegalTableProps) {
  const router = useRouter();

  const Th = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      onClick={() => onSort(field)}
      className="px-4 py-3 text-left font-semibold cursor-pointer select-none whitespace-nowrap border-r last:border-r-0"
      style={{
        backgroundColor: "var(--container)",
        color: "var(--foreground)",
        borderColor: "var(--wrapper)",
      }}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ChevronUp className="w-4 h-4 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 shrink-0" />
          )
        ) : (
          <ChevronsUpDown className="w-4 h-4 shrink-0 opacity-40" />
        )}
      </div>
    </th>
  );

  return (
    <div
      className="overflow-x-auto"
      style={{
        border: "1px solid var(--wrapper)",
      }}
    >
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--wrapper)" }}>
            <Th field="name">ชื่อ - นามสกุล</Th>
            <Th field="nationality">สัญชาติ</Th>
            <Th field="detected_date">วันที่ตรวจพบ</Th>
            <Th field="detected_location">สถานที่ตรวจพบ</Th>
            <Th field="is_victim">สถานะผู้เสียหาย</Th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((person) => (
              <tr
                key={person.id}
                onClick={() => router.push(`/immigrants/${person.id}`)}
                className="cursor-pointer transition-colors"
                style={{
                  backgroundColor: "var(--background)",
                  borderBottom: "1px solid var(--wrapper)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--row-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--background)";
                }}
              >
                <td
                  className="px-4 py-3 whitespace-nowrap border-r"
                  style={{ borderColor: "var(--wrapper)" }}
                >
                  {person.first_name_th} {person.last_name_th}
                </td>
                <td
                  className="px-4 py-3 whitespace-nowrap border-r"
                  style={{ borderColor: "var(--wrapper)" }}
                >
                  {person.nationality || "ไม่ระบุ"}
                </td>
                <td
                  className="px-4 py-3 whitespace-nowrap border-r"
                  style={{ borderColor: "var(--wrapper)" }}
                >
                  {person.detected_date
                    ? new Date(person.detected_date).toLocaleDateString("th-TH")
                    : "ไม่ระบุ"}
                </td>
                <td
                  className="px-4 py-3 max-w-xs truncate border-r"
                  style={{ borderColor: "var(--wrapper)" }}
                >
                  {person.detected_location || "ไม่ระบุสถานที่"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {person.is_victim ? (
                    <span style={{ color: "var(--redText)" }}>เป็นผู้เสียหาย</span>
                  ) : (
                    <span>ไม่ใช่</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-10 text-center"
                style={{ color: "var(--foreground)", opacity: 0.5 }}
              >
                ไม่พบข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}