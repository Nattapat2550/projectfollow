"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import TableHeader, { FieldInfo } from "@/components/table/table-header";
import TableToggle from "@/components/table/table-toggle";
import { Button } from "@/components/ui/button";

export type SortField =
	| "name"
	| "nationality"
	| "detected_date"
	| "detected_location"
	| "is_victim";

interface IllegalTableProps {
	totalItems: number;
	data: IllegalData[];
	sortField: SortField | null;
	sortDirection: "asc" | "desc";
	onSort: (_field: SortField) => void;
	isUpdating: boolean;
	isExportMode?: boolean;
	selectedIds?: string[];
	onToggleSelect?: (_id: string) => void;
	onSelectAll?: (_selectAll: boolean) => void;
}

const defaultHeaderClass: Record<SortField, string> = {
	name: "w-[25%]",
	nationality: "w-[15%]",
	detected_date: "w-[20%]",
	detected_location: "w-[25%]",
	is_victim: "w-[15%]",
};

export default function IllegalTable({
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
}: IllegalTableProps) {
	const router = useRouter();

	const [fieldInfo, setfieldInfo] = useState<FieldInfo<SortField>>({
		name: { label: "ชื่อ-สกุล", visible: true },
		nationality: { label: "สัญชาติ", visible: true },
		detected_date: { label: "วันที่ตรวจพบ", visible: true },
		detected_location: { label: "สถานที่ตรวจพบ", visible: true },
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
			<div className="text-muted-foreground flex items-center justify-between p-4 text-sm font-medium">
				<span>ตารางข้อมูล ({totalItems.toLocaleString("th-TH")} รายการ)</span>
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
					<Button
						disabled={isUpdating}
						type="button"
						className="cursor-pointer pr-4"
						style={{
							backgroundColor: "var(--background)",
							color: "var(--foreground)",
							borderColor: "var(--wrapper)",
						}}
					>
						Toggle
					</Button>
				</TableToggle>
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
								return (
									<tr
										key={person.id}
										onClick={() => {
											if (isExportMode) {
												onToggleSelect?.(person.id);
											} else {
												router.push(`/immigrants/illegal/${person.id}`);
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
										{fieldInfo.nationality.visible && (
											<td
												className="truncate border-r px-4 py-3"
												style={{ borderColor: "var(--wrapper)" }}
												title={person.nationality || "ไม่ระบุ"}
											>
												{person.nationality || "ไม่ระบุ"}
											</td>
										)}
										{fieldInfo.detected_date.visible && (
											<td
												className="truncate border-r px-4 py-3"
												style={{ borderColor: "var(--wrapper)" }}
											>
												{person.detected_date ?
													new Date(person.detected_date).toLocaleDateString("th-TH")
												:	"ไม่ระบุ"}
											</td>
										)}
										{fieldInfo.detected_location.visible && (
											<td
												className="truncate border-r px-4 py-3"
												style={{ borderColor: "var(--wrapper)" }}
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
										)}
										{fieldInfo.is_victim.visible && (
											<td className="truncate px-4 py-3">
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
									colSpan={5}
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
