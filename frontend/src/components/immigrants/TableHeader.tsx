// src/components/immigrants/TableHeader.tsx

export type SortField = "name" | "date_of_birth" | "national_id" | "address";

interface TableHeaderProps {
  sortField: SortField | null;
  sortDirection: "asc" | "desc";
  onSort: (field: SortField) => void;
}

export default function TableHeader({ sortField, sortDirection, onSort }: TableHeaderProps) {
  // ฟังก์ชันแสดงลูกศรสถานะการ Sort ให้ดูทันสมัยขึ้น
  const renderArrow = (field: SortField) => {
    if (sortField !== field) {
      return <span className="ml-1 opacity-30 text-xs">▲▼</span>;
    }
    return sortDirection === "asc" ? (
      <span className="ml-1 text-primary font-bold">▲</span>
    ) : (
      <span className="ml-1 text-primary font-bold">▼</span>
    );
  };

  return (
    <thead>
      <tr 
        className="border-b"
        style={{ backgroundColor: "var(--container)", borderColor: "var(--foreground)" }}
      >
        <th 
          onClick={() => onSort("name")}
          className="py-3 px-4 font-semibold text-sm border-r cursor-pointer select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
          style={{ borderColor: "var(--foreground)", color: "var(--foreground)" }}
        >
          <div className="flex items-center">
            ชื่อ-สกุล {renderArrow("name")}
          </div>
        </th>
        <th 
          onClick={() => onSort("date_of_birth")}
          className="py-3 px-4 font-semibold text-sm border-r cursor-pointer select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
          style={{ borderColor: "var(--foreground)", color: "var(--foreground)" }}
        >
          <div className="flex items-center">
            วัน/เดือน/ปี ที่เกิด {renderArrow("date_of_birth")}
          </div>
        </th>
        <th 
          onClick={() => onSort("national_id")}
          className="py-3 px-4 font-semibold text-sm border-r cursor-pointer select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
          style={{ borderColor: "var(--foreground)", color: "var(--foreground)" }}
        >
          <div className="flex items-center">
            เลขประจำตัวประชาชน {renderArrow("national_id")}
          </div>
        </th>
        <th 
          onClick={() => onSort("address")}
          className="py-3 px-4 font-semibold text-sm cursor-pointer select-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
          style={{ color: "var(--foreground)" }}
        >
          <div className="flex items-center">
            ที่อยู่ {renderArrow("address")}
          </div>
        </th>
      </tr>
    </thead>
  );
}