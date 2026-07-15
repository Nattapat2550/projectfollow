"use client";

import TableHeader from "./TableHeader";
import TableRow from "./TableRow";
import { useTableSort } from "@/hooks/useTableSort"; // 🟢 ดึง hook ใหม่มาใช้ (แก้ไข path ตามจริง)

interface ImmigrantsTableProps {
	data: any[];
	isMock: boolean;
	type: "repatriated" | "illegal";
}

export default function ImmigrantsTable({
	data,
	isMock,
	type,
}: ImmigrantsTableProps) {
	// 🟢 ย้ายตรรกะทั้งหมดออกไปใน Custom Hook
	const { sortField, sortDirection, handleSort, sortedData } =
		useTableSort(data);

	return (
		<div
			className="w-full overflow-hidden rounded-lg border shadow-sm"
			style={{ borderColor: "var(--wrapper)" }}
		>
			<table className="w-full table-fixed text-left text-sm whitespace-nowrap [&_td]:max-w-0 [&_td]:truncate [&_th]:max-w-0 [&_th]:truncate">
				<TableHeader
					sortField={sortField}
					sortDirection={sortDirection}
					onSort={handleSort}
					type={type}
				/>
				<tbody
					className="bg-background divide-y"
					style={{ borderColor: "var(--wrapper)" }}
				>
					{sortedData.length > 0 ?
						sortedData.map((person) => (
							<TableRow
								key={person.id}
								person={person}
								isMock={isMock}
								type={type}
							/>
						))
					:	<tr>
							<td colSpan={7} className="text-muted-foreground p-8 text-center">
								ไม่พบข้อมูลในตาราง
							</td>
						</tr>
					}
				</tbody>
			</table>
		</div>
	);
}
