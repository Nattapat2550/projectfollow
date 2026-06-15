"use client";

import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export type SortField = "name" | "date_of_birth" | "national_id" | "address" | "return_date" | "result";

interface DeportedTableProps {
  data: any[];
  sortField: SortField | null;
  sortDirection: "asc" | "desc";
  onSort: (field: SortField) => void;
}

export default function DeportedTable({ data, sortField, sortDirection, onSort }: DeportedTableProps) {
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
      className="w-full overflow-hidden rounded-sm"
      style={{
        border: "1px solid var(--wrapper)",
      }}
    >
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--wrapper)" }}>
            <Th field="name">ชื่อ-สกุล</Th>
            <Th field="date_of_birth">วัน/เดือน/ปี ที่เกิด</Th>
            <Th field="national_id">เลขประจำตัวประชาชน</Th>
            <Th field="address">ที่อยู่</Th>
            <Th field="return_date">วันที่ส่งกลับ</Th>
            <Th field="result">สถานะ</Th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((person, index) => {
              const fullName = `${person.first_name_th} ${person.last_name_th}`;
              const nationalId = person.national_id || person.passport_id || "ไม่ระบุ";
              const address = person.address || "ไม่ระบุสถานที่";

              return (
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
                    className="px-4 py-3 border-r truncate max-w-37.5"
                    style={{ borderColor: "var(--wrapper)" }}
                    title={fullName} 
                  >
                    {fullName}
                  </td>
                  {/* ✨ แก้ไขการแสดงผล Date ของ date_of_birth ให้ฟอร์แมตถูกต้อง */}
                  <td
                    className="px-4 py-3 border-r truncate max-w-30"
                    style={{ borderColor: "var(--wrapper)" }}
                  >
                    {person.date_of_birth ? new Date(person.date_of_birth).toLocaleDateString("th-TH", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "ไม่ระบุ"}
                    {person.age ? ` (${person.age} ปี)` : ""}
                  </td>
                  <td
                    className="px-4 py-3 border-r truncate max-w-32.5"
                    style={{ borderColor: "var(--wrapper)" }}
                    title={nationalId}
                  >
                    {nationalId}
                  </td>
                  <td
                    className="px-4 py-3 border-r truncate max-w-50"
                    style={{ borderColor: "var(--wrapper)" }}
                    title={address}
                  >
                    {address}
                  </td>
                  <td
                    className="px-4 py-3 border-r truncate max-w-25"
                    style={{ borderColor: "var(--wrapper)" }}
                  >
                    {person.return_date
                      ? new Date(person.return_date).toLocaleDateString("th-TH")
                      : "รอการส่งกลับ"}
                  </td>
                  <td className="px-4 py-3 font-medium truncate max-w-25">
                    {person.result === "SUCCESS" && (
                      <span style={{ color: "var(--greenText)" }}>สำเร็จ</span>
                    )}
                    {person.result === "FAILED" && (
                      <span style={{ color: "var(--redText)" }}>ล้มเหลว</span>
                    )}
                    {(!person.result || person.result === "PENDING") && (
                      <span style={{ color: "var(--yellowText)" }}>รอดำเนินการ</span>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={6}
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