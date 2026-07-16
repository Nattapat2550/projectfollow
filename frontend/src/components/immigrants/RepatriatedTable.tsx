"use client";

import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

export const helperFormatDOBAndAge = (dob: string | null, age: number | string | null): string => {
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

interface RepatriatedTableProps {
	data: any[];
	sortField: SortField | null;
	sortDirection: "asc" | "desc";
	onSort: (field: SortField) => void;
	isExportMode?: boolean;
	selectedIds?: string[];
	onToggleSelect?: (id: string) => void;
	onSelectAll?: (selectAll: boolean) => void;
}

export default function RepatriatedTable({
	data,
	sortField,
	sortDirection,
	onSort,
	isExportMode,
	selectedIds,
	onToggleSelect,
	onSelectAll,
}: RepatriatedTableProps) {
	const router = useRouter();

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
			{/* เพิ่ม table-fixed ล็อคขนาดตาราง */}
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
						<Th field="name" width="w-[20%]">
							ชื่อ-สกุล
						</Th>
						<Th field="date_of_birth" width="w-[15%]">
							วันเกิด (อายุ)
						</Th>
						<Th field="national_id" width="w-[15%]">
							เลขประจำตัว
						</Th>
						<Th field="address" width="w-[20%]">
							ที่อยู่
						</Th>
						<Th field="return_date" width="w-[15%]">
							วันที่ส่งกลับ
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
									{/* เปลี่ยนเป็น truncate ทั้งหมดและใส่ title ให้ hover ดูข้อความเต็มได้ */}
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
									>
										{helperFormatDOBAndAge(person.date_of_birth, person.age)}
									</td>
									<td
										className="truncate border-r px-4 py-3"
										style={{ borderColor: "var(--wrapper)" }}
										title={nationalId}
									>
										{nationalId}
									</td>
									<td
										className="truncate border-r px-4 py-3"
										style={{ borderColor: "var(--wrapper)" }}
										title={address}
									>
										{address}
									</td>
									<td
										className="truncate border-r px-4 py-3"
										style={{ borderColor: "var(--wrapper)" }}
									>
										{person.return_date ?
											new Date(person.return_date).toLocaleDateString("th-TH")
										:	"รอการส่งกลับ"}
									</td>
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
	);
}
