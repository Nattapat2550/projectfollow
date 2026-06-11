// src/components/immigrants/ImmigrantsTable.tsx
"use client";

import { useState, useMemo } from "react";
import { DeportedPerson } from "./mockData";
import TableHeader, { SortField } from "./TableHeader";
import TableRow from "./TableRow";

interface ImmigrantsTableProps {
  data: DeportedPerson[];
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

  // ประมวลผลเรียงลำดับข้อมูล
  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      // 🎯 เคสพิเศษ: การจัดเรียง วัน/เดือน/ปี เกิด (เช่น "12/05/2535")
      if (sortField === "date_of_birth") {
        const parseDate = (dateStr: string) => {
          if (!dateStr) return "";
          const parts = dateStr.split("/");
          if (parts.length !== 3) return dateStr;
          const [day, month, year] = parts;
          // แปลงกลับเป็น ปี-เดือน-วัน เพื่อให้สามารถเรียงลำดับอักษร/ตัวเลขได้ถูกต้องตามหลักสากล
          return `${year}-${month}-${day}`;
        };

        const aDate = parseDate(a.date_of_birth);
        const bDate = parseDate(b.date_of_birth);

        return sortDirection === "asc" 
          ? aDate.localeCompare(bDate) 
          : bDate.localeCompare(aDate);
      }

      // เคสปกติ: ข้อความทั่วไป
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
    <div className="overflow-x-auto border rounded-sm" style={{ borderColor: "var(--foreground)" }}>
      <table className="w-full text-left border-collapse">
        <TableHeader 
          sortField={sortField} 
          sortDirection={sortDirection} 
          onSort={handleSort} 
        />
        <tbody className="divide-y" style={{ borderColor: "var(--foreground)" }}>
          {sortedData.map((person) => (
            <TableRow key={person.id} person={person} isMock={isMock} type={type} />
          ))}
        </tbody>
      </table>
    </div>
  );
}