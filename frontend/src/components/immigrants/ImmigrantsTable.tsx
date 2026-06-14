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
      // จัดการเรียงลำดับคอลัมน์ที่เป็นวันที่ของทั้ง 2 ตาราง
      const dateFields = ["date_of_birth", "detected_date", "return_date"];
      if (dateFields.includes(sortField as string)) {
        const parseDate = (dateStr: string) => {
          if (!dateStr || dateStr === "ไม่ระบุ") return "";
          if (dateStr.includes("/")) {
            const parts = dateStr.split("/");
            if (parts.length === 3) {
              const [day, month, year] = parts;
              return `${year}-${month}-${day}`;
            }
          }
          return dateStr;
        };

        const aDate = parseDate(a[sortField]);
        const bDate = parseDate(b[sortField]);

        return sortDirection === "asc" 
          ? aDate.localeCompare(bDate) 
          : bDate.localeCompare(aDate);
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
    <div className="overflow-x-auto border rounded-lg shadow-sm" style={{ borderColor: "var(--wrapper)" }}>
      <table className="w-full text-left text-sm whitespace-nowrap">
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