"use client";

import { useState, useMemo } from "react";
import TableHeader, { SortField } from "./TableHeader";
import TableRow from "./TableRow";

interface ImmigrantsTableProps {
  data: any[]; // <--- แก้เป็น any[] เพื่อให้ยืดหยุ่นรับข้อมูลได้ทั้ง 2 ตาราง
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

    // เติม any เข้าไปในพารามิเตอร์ของ sort เพื่อไม่ให้เกิด Type Error
    return [...data].sort((a: any, b: any) => {
      if (sortField === "date_of_birth") {
        const parseDate = (dateStr: string) => {
          if (!dateStr) return "";
          const parts = dateStr.split("/");
          if (parts.length !== 3) return dateStr;
          const [day, month, year] = parts;
          return `${year}-${month}-${day}`;
        };

        const aDate = parseDate(a.date_of_birth);
        const bDate = parseDate(b.date_of_birth);

        return sortDirection === "asc" 
          ? aDate.localeCompare(bDate) 
          : bDate.localeCompare(aDate);
      }

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