"use client";

import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export type SortField =
	| "name"
	| "nationality"
	| "detected_date"
	| "detected_location"
	| "is_victim";

interface IllegalTableProps {
	data: any[];
	sortField: SortField | null;
	sortDirection: "asc" | "desc";
	onSort: (field: SortField) => void;
	isExportMode?: boolean;
	selectedIds?: string[];
	onToggleSelect?: (id: string) => void;
	onSelectAll?: (selectAll: boolean) => void;
}

export default function IllegalTable({
	data,
	sortField,
	sortDirection,
	onSort,
	isExportMode,
	selectedIds,
	onToggleSelect,
	onSelectAll,
}: IllegalTableProps) {
	const router = useRouter();

	// เพิ่ม props width เพื่อกำหนดความกว้างคอลัมน์
	const Th = ({
		field,
		width,
		children,
	}: {
		field: SortField;
		width?: string;
		children: React.ReactNode;
	}) => (
		<th
			onClick={() => onSort(field)}
			className={`cursor-pointer truncate border-r px-4 py-3 text-left font-semibold select-none last:border-r-0 ${width || ""}`}
			style={{
				backgroundColor: "var(--container)",
				color: "var(--foreground)",
				borderColor: "var(--wrapper)",
			}}
			title={children as string}
		>
			<div className="flex items-center gap-1 truncate">
				<span className="truncate">{children}</span>
				{sortField === field ?
					sortDirection === "asc" ?
						<ChevronUp className="h-4 w-4 shrink-0" />
					:	<ChevronDown className="h-4 w-4 shrink-0" />
				:	<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-40" />}
			</div>
		</th>
	);

	return (
		<div
			className="w-full overflow-hidden rounded-sm"
			style={{ border: "1px solid var(--wrapper)" }}
		>
			{/* เพิ่ม table-fixed เพื่อล็อคความกว้าง */}
			<table className="w-full table-fixed border-collapse text-left text-sm">
				<thead>
					<tr style={{ borderBottom: "1px solid var(--wrapper)" }}>
						{isExportMode && (
							<th
								className="w-[50px] shrink-0 border-r px-4 py-3 text-center"
								style={{
									backgroundColor: "var(--container)",
									borderColor: "var(--wrapper)",
								}}
							>
								<input
									type="checkbox"
									className="h-4 w-4 cursor-pointer accent-(--blueText)"
									checked={data.length > 0 && data.every((p) => selectedIds?.includes(p.id))}
									onChange={(e) => onSelectAll?.(e.target.checked)}
								/>
							</th>
						)}
						<Th field="name" width="w-[25%]">
							ชื่อ - นามสกุล
						</Th>
						<Th field="nationality" width="w-[15%]">
							สัญชาติ
						</Th>
						<Th field="detected_date" width="w-[20%]">
							วันที่ตรวจพบ
						</Th>
						<Th field="detected_location" width="w-[25%]">
							สถานที่ตรวจพบ
						</Th>
						<Th field="is_victim" width="w-[15%]">
							สถานะผู้เสียหาย
						</Th>
					</tr>
				</thead>
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
											router.push(`/immigrants/${person.id}`);
										}
									}}
									className="cursor-pointer transition-colors"
									style={{
										backgroundColor:
											selectedIds?.includes(person.id) ? "var(--row-hover)" : "var(--background)",
										borderBottom: "1px solid var(--wrapper)",
									}}
									onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--row-hover)")}
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
									<td
										className="truncate border-r px-4 py-3"
										style={{ borderColor: "var(--wrapper)" }}
										title={fullName}
									>
										{fullName}
									</td>
									<td
										className="truncate border-r px-4 py-3"
										style={{ borderColor: "var(--wrapper)" }}
										title={person.nationality || "ไม่ระบุ"}
									>
										{person.nationality || "ไม่ระบุ"}
									</td>
									<td
										className="truncate border-r px-4 py-3"
										style={{ borderColor: "var(--wrapper)" }}
									>
										{person.detected_date ?
											new Date(person.detected_date).toLocaleDateString("th-TH")
										:	"ไม่ระบุ"}
									</td>
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
	);
}
