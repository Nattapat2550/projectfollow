import Link from "next/link";
import { Eye } from "lucide-react";

export const helperFormatDOBAndAge = (
	dob: string | null,
	age: number | string | null
): string => {
	let ageStr = age ? `${age} ปี` : "";
	if (dob) {
		const d = new Date(dob);
		if (!isNaN(d.getTime())) {
			const dateStr = d.toLocaleDateString("th-TH", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
			return `${dateStr}${ageStr ? ` (${ageStr})` : ""}`;
		}
	}
	return ageStr || "-";
};

export default function TableRow({
	person,
	isMock,
	type,
}: {
	person: any;
	isMock: boolean;
	type: "repatriated" | "illegal";
}) {
	const ActionButtons = () => {
		const detailUrl =
			type === "illegal" ?
				`/immigrant/${person.id}`
			:	`/repatriate/${person.id}`;

		return (
			<div className="flex items-center gap-2">
				<Link
					href={detailUrl}
					className="rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-900/30"
					title="ดูรายละเอียด"
				>
					<Eye className="h-4 w-4" />
				</Link>
			</div>
		);
	};

	if (type === "illegal") {
		return (
			<tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
				<td
					className="text-foreground truncate p-4 align-middle font-medium"
					title={`${person.first_name_th} ${person.last_name_th}`}
				>
					{person.first_name_th} {person.last_name_th}
				</td>
				<td
					className="text-muted-foreground truncate p-4 align-middle"
					title={person.nationality || "ไม่ระบุ"}
				>
					{person.nationality || "ไม่ระบุ"}
				</td>
				<td className="text-muted-foreground truncate p-4 align-middle">
					{person.detected_date ?
						new Date(person.detected_date).toLocaleDateString("th-TH")
					:	"ไม่ระบุ"}
				</td>
				<td
					className="text-muted-foreground truncate p-4 align-middle"
					title={
						person.detected_location_details ?
							`${person.detected_location_details} ${person.detected_location_sub_district ? "ต." + person.detected_location_sub_district : ""} ${person.detected_location_district ? "อ." + person.detected_location_district : ""} ${person.detected_location_province ? "จ." + person.detected_location_province : ""}`
						:	"ไม่ระบุสถานที่"
					}
				>
					{person.detected_location_details ?
						`${person.detected_location_details} ${person.detected_location_sub_district ? "ต." + person.detected_location_sub_district : ""} ${person.detected_location_district ? "อ." + person.detected_location_district : ""} ${person.detected_location_province ? "จ." + person.detected_location_province : ""}`
					:	"ไม่ระบุสถานที่"}
				</td>
				<td className="truncate p-4 align-middle">
					{person.is_victim === "YES" ?
						<span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
							เป็นผู้เสียหาย
						</span>
					: person.is_victim === "NO" ?
						<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
							ไม่เป็นผู้เสียหาย
						</span>
					:	<span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-1 text-xs font-medium text-stone-700 dark:bg-zinc-800 dark:text-zinc-400">
							ไม่คัดกรองสถานะ
						</span>
					}
				</td>
				<td className="p-4 align-middle">
					<ActionButtons />
				</td>
			</tr>
		);
	}

	return (
		<tr className="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
			<td
				className="text-foreground truncate p-4 align-middle font-medium"
				title={`${person.first_name_th} ${person.last_name_th}`}
			>
				{person.first_name_th} {person.last_name_th}
			</td>
			<td className="text-muted-foreground truncate p-4 align-middle">
				{helperFormatDOBAndAge(person.date_of_birth, person.age)}
			</td>
			<td
				className="text-muted-foreground truncate p-4 align-middle"
				title={person.national_id || person.passport_id || "ไม่ระบุ"}
			>
				{person.national_id || person.passport_id || "ไม่ระบุ"}
			</td>
			<td
				className="text-muted-foreground truncate p-4 align-middle"
				title={
					person.address_details ?
						`${person.address_details} ${person.sub_district ? "ต." + person.sub_district : ""} ${person.district ? "อ." + person.district : ""} ${person.province ? "จ." + person.province : ""}`
					:	"ไม่ระบุสถานที่"
				}
			>
				{person.address_details ?
					`${person.address_details} ${person.sub_district ? "ต." + person.sub_district : ""} ${person.district ? "อ." + person.district : ""} ${person.province ? "จ." + person.province : ""}`
				:	"ไม่ระบุสถานที่"}
			</td>
			<td className="text-muted-foreground truncate p-4 align-middle">
				{person.return_date ?
					new Date(person.return_date).toLocaleDateString("th-TH")
				:	"รอการส่งกลับ"}
			</td>
			<td className="truncate p-4 align-middle text-sm">
				{person.is_victim === "YES" && (
					<span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
						เป็นผู้เสียหาย
					</span>
				)}
				{person.is_victim === "NO" && (
					<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
						ไม่เป็นผู้เสียหาย
					</span>
				)}
				{(!person.is_victim || person.is_victim === "PENDING") && (
					<span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700 dark:bg-zinc-800 dark:text-zinc-400">
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
