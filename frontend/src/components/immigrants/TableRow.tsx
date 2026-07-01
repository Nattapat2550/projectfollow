import Link from "next/link";
import { Eye } from "lucide-react";

export default function TableRow({ person, isMock, type }: { person: any, isMock: boolean, type: "repatriated" | "illegal" }) {
  
  const ActionButtons = () => {
    const detailUrl = type === "illegal" 
        ? `/immigrant/${person.id}` 
        : `/repatriate/${person.id}`;

    return (
      <div className="flex items-center gap-2">
        <Link 
          href={detailUrl} 
          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition"
          title="ดูรายละเอียด"
        >
          <Eye className="w-4 h-4" />
        </Link>
      </div>
    );
  };

  if (type === "illegal") {
    return (
      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
        <td className="p-4 align-middle font-medium text-foreground truncate" title={`${person.first_name_th} ${person.last_name_th}`}>
           {person.first_name_th} {person.last_name_th}
        </td>
        <td className="p-4 align-middle text-muted-foreground truncate" title={person.nationality || "ไม่ระบุ"}>
          {person.nationality || "ไม่ระบุ"}
        </td>
        <td className="p-4 align-middle text-muted-foreground truncate">
          {person.detected_date ? new Date(person.detected_date).toLocaleDateString('th-TH') : "ไม่ระบุ"}
        </td>
        <td className="p-4 align-middle text-muted-foreground truncate" title={person.detected_location_details ? `${person.detected_location_details} ${person.detected_location_sub_district ? 'ต.'+person.detected_location_sub_district : ''} ${person.detected_location_district ? 'อ.'+person.detected_location_district : ''} ${person.detected_location_province ? 'จ.'+person.detected_location_province : ''}` : "ไม่ระบุสถานที่"}>
          {person.detected_location_details ? `${person.detected_location_details} ${person.detected_location_sub_district ? 'ต.'+person.detected_location_sub_district : ''} ${person.detected_location_district ? 'อ.'+person.detected_location_district : ''} ${person.detected_location_province ? 'จ.'+person.detected_location_province : ''}` : "ไม่ระบุสถานที่"}
        </td>
        <td className="p-4 align-middle truncate">
          {person.is_victim === "YES" ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              เป็นผู้เสียหาย
            </span>
          ) : person.is_victim === "NO" ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              ไม่เป็นผู้เสียหาย
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-700 dark:bg-zinc-800 dark:text-zinc-400">
              ไม่คัดกรองสถานะ
            </span>
          )}
        </td>
        <td className="p-4 align-middle">
          <ActionButtons />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
        <td className="p-4 align-middle font-medium text-foreground truncate" title={`${person.first_name_th} ${person.last_name_th}`}>
           {person.first_name_th} {person.last_name_th}
        </td>
        <td className="p-4 align-middle text-muted-foreground truncate">
          {person.date_of_birth || "ไม่ระบุ"} {person.age ? `(${person.age} ปี)` : ""}
        </td>
        <td className="p-4 align-middle text-muted-foreground truncate" title={person.national_id || person.passport_id || "ไม่ระบุ"}>
          {person.national_id || person.passport_id || "ไม่ระบุ"}
        </td>
        <td className="p-4 align-middle text-muted-foreground truncate" title={person.address_details ? `${person.address_details} ${person.sub_district ? 'ต.'+person.sub_district : ''} ${person.district ? 'อ.'+person.district : ''} ${person.province ? 'จ.'+person.province : ''}` : "ไม่ระบุสถานที่"}>
          {person.address_details ? `${person.address_details} ${person.sub_district ? 'ต.'+person.sub_district : ''} ${person.district ? 'อ.'+person.district : ''} ${person.province ? 'จ.'+person.province : ''}` : "ไม่ระบุสถานที่"}
        </td>
        <td className="p-4 align-middle text-muted-foreground truncate">
          {person.return_date ? new Date(person.return_date).toLocaleDateString('th-TH') : "รอการส่งกลับ"}
        </td>
        <td className="p-4 align-middle text-sm truncate">
           {person.is_victim === "YES" && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">เป็นผู้เสียหาย</span>}
           {person.is_victim === "NO" && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">ไม่เป็นผู้เสียหาย</span>}
           {(!person.is_victim || person.is_victim === "PENDING") && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 dark:bg-zinc-800 dark:text-zinc-400">ไม่คัดกรองสถานะ</span>}
        </td>
        <td className="p-4 align-middle">
          <ActionButtons />
        </td>
    </tr>
  );
}