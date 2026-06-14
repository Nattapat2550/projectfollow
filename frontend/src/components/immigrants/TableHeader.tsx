import { ChevronUp, ChevronDown } from "lucide-react";

export type SortField = "name" | "date_of_birth" | "detected_date" | "national_id" | "nationality" | "address" | "detected_location" | "is_victim" | "return_date" | "result";

interface TableHeaderProps {
  sortField: SortField | null;
  sortDirection: "asc" | "desc";
  onSort: (field: SortField) => void;
  type: "deported" | "illegal";
}

export default function TableHeader({ sortField, sortDirection, onSort, type }: TableHeaderProps) {
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="ml-1 w-4 inline-block text-transparent">↕</span>;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 w-4 h-4 inline-block text-foreground" />
    ) : (
      <ChevronDown className="ml-1 w-4 h-4 inline-block text-foreground" />
    );
  };

  const Th = ({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <th 
      onClick={() => onSort(field)} 
      className={`p-4 font-semibold text-(--header) cursor-pointer hover:bg-muted/50 select-none ${className}`}
    >
      <div className="flex items-center">
        {children}
        {renderSortIcon(field)}
      </div>
    </th>
  );

  // ─── 1. หัวตาราง แอบเข้าเมือง (Illegal) ───
  if (type === "illegal") {
    return (
      <thead className="bg-muted/30 border-b border-(--wrapper)">
        <tr>
          <Th field="name">ชื่อ - นามสกุล</Th>
          <Th field="nationality">สัญชาติ</Th>
          <Th field="detected_date">วันที่ตรวจพบ</Th>
          <Th field="detected_location">สถานที่ตรวจพบ</Th>
          <Th field="is_victim">สถานะผู้เสียหาย</Th>
          <th className="p-4 font-semibold text-(--header) w-20">จัดการ</th>
        </tr>
      </thead>
    );
  }

  // ─── 2. หัวตาราง ผู้ถูกส่งกลับ (Deported) ───
  return (
    <thead className="bg-muted/30 border-b border-(--wrapper)">
      <tr>
        <Th field="name">ชื่อ - นามสกุล</Th>
        <Th field="date_of_birth">วันเกิด / อายุ</Th>
        <Th field="national_id">เลขประจำตัว / พาสปอร์ต</Th>
        <Th field="address">สถานที่ตรวจพบ</Th>
        <Th field="return_date">วันที่ส่งกลับ</Th>
        <Th field="result">สถานะ</Th>
        <th className="p-4 font-semibold text-(--header) w-20">จัดการ</th>
      </tr>
    </thead>
  );
}