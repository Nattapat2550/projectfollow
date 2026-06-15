"use client";

import { useState, useMemo } from "react";
import TableHeader, { SortField } from "./TableHeader";
import TableRow from "./TableRow";

interface ImmigrantsTableProps {
  data: any[]; 
  isMock: boolean;
  type: "deported" | "illegal";
}

export default function ImmigrantsTable({ data, isMock, type }: ImmigrantsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a: any, b: any) => {
      // จัดการเรียงลำดับคอลัมน์ที่เป็นวันที่
      const dateFields = ["date_of_birth", "detected_date", "return_date"];
      if (dateFields.includes(sortField as string)) {
        const parseDateToTimestamp = (val: any) => {
          if (!val || val === "ไม่ระบุ") return 0;
          const dateStr = String(val).trim();
          
          // ตรวจสอบกรณีรูปแบบ DD/MM/YYYY
          if (dateStr.includes("/")) {
            const parts = dateStr.split("/");
            if (parts.length === 3) {
              const [day, month, year] = parts;
              // รองรับกรณีเป็นปี พ.ศ.
              const parsedYear = parseInt(year) > 2500 ? parseInt(year) - 543 : year;
              return new Date(`${parsedYear}-${month}-${day}`).getTime() || 0;
            }
          }
          // สำหรับ ISO String หรือรูปแบบวันที่มาตรฐาน
          const parsed = new Date(dateStr).getTime();
          return isNaN(parsed) ? 0 : parsed;
        };

        const aTime = parseDateToTimestamp(a[sortField]);
        const bTime = parseDateToTimestamp(b[sortField]);

        return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
      }

      // จัดการคอลัมน์ข้อความทั่วไป
      let aValue = "";
      let bValue = "";

      if (sortField === "name") {
        aValue = `${a.first_name_th || ""} ${a.last_name_th || ""}`.trim();
        bValue = `${b.first_name_th || ""} ${b.last_name_th || ""}`.trim();
      } else {
        aValue = (a[sortField] || "").toString();
        bValue = (b[sortField] || "").toString();
      }

      const compareResult = aValue.localeCompare(bValue, "th", { sensitivity: "base" });
      return sortDirection === "asc" ? compareResult : -compareResult;
    });
  }, [data, sortField, sortDirection]);

  return (
    <div className="w-full border rounded-lg shadow-sm overflow-hidden" style={{ borderColor: "var(--wrapper)" }}>
      <table className="w-full text-left text-sm table-fixed whitespace-nowrap [&_td]:truncate [&_th]:truncate [&_td]:max-w-0 [&_th]:max-w-0">
        <TableHeader 
          sortField={sortField} 
          sortDirection={sortDirection} 
          onSort={handleSort} 
          type={type} 
        />
        <tbody className="divide-y bg-background" style={{ borderColor: "var(--wrapper)" }}>
          {sortedData.length > 0 ? (
            sortedData.map((person) => (
              <TableRow key={person.id} person={person} isMock={isMock} type={type} />
            ))
          ) : (
            <tr>
              <td colSpan={7} className="p-8 text-center text-muted-foreground">
                ไม่พบข้อมูลในตาราง
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}