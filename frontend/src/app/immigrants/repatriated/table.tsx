"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import TableHeader, { FieldInfo } from "@/components/table/table-header";
import TableToggle from "@/components/table/table-toggle";
import { Button } from "@/components/ui/button";

import RepatriatedTableFilter, { RepatriatedTableFilterProps } from "./filter";

export const helperFormatDOBAndAge = (
	dob: string | null | undefined,
	age: number | string | null
): string => {
	let computedAge = age;

	if (dob && !computedAge) {
		const birthDate = new Date(dob);
		if (!isNaN(birthDate.getTime())) {
			const today = new Date();
			let ageNum = today.getFullYear() - birthDate.getFullYear();
			const m = today.getMonth() - birthDate.getMonth();
			if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
				ageNum--;
			}
			if (ageNum >= 0) {
				computedAge = ageNum;
			}
		}
	}

	const ageStr = computedAge ? `${computedAge} ปี` : "";
	if (dob) {
		const d = new Date(dob);
		if (!isNaN(d.getTime())) {
			const dateStr = d.toLocaleDateString("th-TH", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			});
			return `${dateStr}${ageStr ? ` (${ageStr})` : ""}`;
		}
	}
	return ageStr || "-";
};

export type SortField =
	| "name"
	| "date_of_birth"
	| "national_id"
	| "address"
	| "return_date"
	| "is_victim";

type RepatriatedTableProps = {
	totalItems: number;
	data: RepatriatedData[];
	sortField: SortField | null;
	sortDirection: "asc" | "desc";
	onSort: (_field: SortField) => void;
	isUpdating: boolean;
	isExportMode?: boolean;
	selectedIds?: string[];
	onToggleSelect?: (_id: string) => void;
	onSelectAll?: (_selectAll: boolean) => void;
} & Partial<RepatriatedTableFilterProps>;

const defaultHeaderClass: Record<SortField, string> = {
	name: "w-[20%]",
	date_of_birth: "w-[15%]",
	national_id: "w-[15%]",
	address: "w-[20%]",
	return_date: "w-[15%]",
	is_victim: "w-[15%]",
};

export default function RepatriatedTable({
	filter,
	setFilter,
	totalItems,
	data,
	isExportMode,
	selectedIds,
	onToggleSelect,
	onSelectAll,
	onSort,
	sortField,
	sortDirection,
	isUpdating,
}: RepatriatedTableProps) {
	const router = useRouter();

	const [fieldInfo, setfieldInfo] = useState<FieldInfo<SortField>>({
		name: { label: "ชื่อ-สกุล", visible: true },
		date_of_birth: { label: "วันเกิด (อายุ)", visible: true },
		national_id: { label: "เลขประจำตัว", visible: true },
		address: { label: "ที่อยู่", visible: true },
		return_date: { label: "วันที่ส่งกลับ", visible: true },
		is_victim: { label: "สถานะผู้เสียหาย", visible: true },
	});

	const fields: FieldInfo<SortField> =
		(
			Object.entries(fieldInfo).reduce((prev, [, info]) => prev + (info.visible ? 1 : 0), 0)
			== Object.keys(fieldInfo).length
		) ?
			(Object.fromEntries(
				Object.entries(fieldInfo).map(([key, info]) => [
					key,
					{
						...info,
						headerProps: { ...info.headerProps, className: defaultHeaderClass[key as SortField] },
					},
				])
			) as FieldInfo<SortField>)
		:	fieldInfo;

	return (
		<div>
			<div className="flex items-center justify-between p-4 text-sm font-medium">
				<span className="opacity-70">
					ตารางข้อมูล ({totalItems.toLocaleString("th-TH")} รายการ)
				</span>
				<div className="space-x-2">
					{filter && setFilter && <RepatriatedTableFilter filter={filter} setFilter={setFilter} />}
					<TableToggle
						fieldInfo={fieldInfo}
						onChange={(name, checked) => {
							setfieldInfo((prev) => {
								const newState = { ...prev };
								newState[name].visible = checked;
								return newState;
							});
						}}
					>
						<Button disabled={isUpdating} type="button" variant="outline">
							Toggle
						</Button>
					</TableToggle>
				</div>
			</div>
			<div
				className="w-full overflow-hidden rounded-sm"
				style={{ border: "1px solid var(--wrapper)" }}
			>
				<table className="w-full table-fixed border-collapse text-left text-sm">
					<TableHeader
						onSort={onSort}
						sortDirection={sortDirection}
						sortField={sortField}
						isExportMode={isExportMode}
						isSelectingAll={data.length > 0 && data.every((p) => selectedIds?.includes(p.id))}
						onSelectAll={onSelectAll}
						fields={fields}
					/>
					<tbody>
						{data.length > 0 ?
							data.map((person) => {
								const fullName = `${person.first_name_th} ${person.last_name_th}`;
								const nationalId = person.national_id || person.passport_id || "ไม่ระบุ";
								const address =
									person.address_details ?
										`${person.address_details} ${person.sub_district ? "ต." + person.sub_district : ""} ${person.district ? "อ." + person.district : ""} ${person.province ? "จ." + person.province : ""}`
									:	"ไม่ระบุสถานที่";

								return (
									<tr
										key={person.id}
										onClick={() => {
											if (isExportMode) {
												onToggleSelect?.(person.id);
											} else {
												router.push(`/immigrants/repatriated/${person.id}`);
											}
										}}
										className="cursor-pointer transition-colors"
										style={{
											backgroundColor:
												selectedIds?.includes(person.id) ? "var(--row-hover)" : "var(--background)",
											borderBottom: "1px solid var(--wrapper)",
										}}
										onMouseEnter={(e) =>
											(e.currentTarget.style.backgroundColor = "var(--row-hover)")
										}
										onMouseLeave={(e) =>
											(e.currentTarget.style.backgroundColor =
												selectedIds?.includes(person.id) ? "var(--row-hover)" : "var(--background)")
										}
									>
										{isExportMode && (
											<td
												className="border-r px-4 py-3 text-center"
												style={{ borderColor: "var(--wrapper)" }}
												onClick={(e) => e.stopPropagation()}
											>
												<input
													type="checkbox"
													className="h-4 w-4 cursor-pointer accent-(--blueText)"
													checked={selectedIds?.includes(person.id)}
													onChange={() => onToggleSelect?.(person.id)}
												/>
											</td>
										)}
										{fieldInfo.name.visible && (
											<td
												className="truncate border-r px-4 py-3"
												style={{ borderColor: "var(--wrapper)" }}
												title={fullName}
											>
												{fullName}
											</td>
										)}
										{fieldInfo.date_of_birth.visible && (
											<td
												className="truncate border-r px-4 py-3"
												style={{ borderColor: "var(--wrapper)" }}
											>
												{helperFormatDOBAndAge(person.date_of_birth, null)}
											</td>
										)}
										{fieldInfo.national_id.visible && (
											<td
												className="truncate border-r px-4 py-3"
												style={{ borderColor: "var(--wrapper)" }}
												title={nationalId}
											>
												{nationalId}
											</td>
										)}
										{fieldInfo.address.visible && (
											<td
												className="truncate border-r px-4 py-3"
												style={{ borderColor: "var(--wrapper)" }}
												title={address}
											>
												{address}
											</td>
										)}
										{fieldInfo.return_date.visible && (
											<td
												className="truncate border-r px-4 py-3"
												style={{ borderColor: "var(--wrapper)" }}
											>
												{person.return_date ?
													new Date(person.return_date).toLocaleDateString("th-TH")
												:	"รอการส่งกลับ"}
											</td>
										)}
										{fieldInfo.is_victim.visible && (
											<td className="truncate px-4 py-3 font-medium">
												{person.is_victim === "YES" ?
													<span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
														เป็นผู้เสียหาย
													</span>
												: person.is_victim === "NO" ?
													<span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
														ไม่เป็นผู้เสียหาย
													</span>
												:	<span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700 dark:bg-zinc-800 dark:text-zinc-400">
														ไม่คัดกรองสถานะ
													</span>
												}
											</td>
										)}
									</tr>
								);
							})
						:	<tr>
								<td
									colSpan={6}
									className="px-4 py-10 text-center"
									style={{ color: "var(--foreground)", opacity: 0.5 }}
								>
									ไม่พบข้อมูล
								</td>
							</tr>
						}
					</tbody>
				</table>
			</div>
		</div>
	);
}
