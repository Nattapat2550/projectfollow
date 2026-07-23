"use client";

import { useState } from "react";

import TableFilter from "@/components/table/table-filter";
import { Button } from "@/components/ui/button";
import { GetAllRepatriatedRequestQuery } from "@/lib/schema/repatriated";

export type FilterOptions = Pick<
	GetAllRepatriatedRequestQuery,
	"startDate" | "endDate" | "dobStart" | "dobEnd" | "isVictim"
>;
export interface RepatriatedTableFilterProps {
	filter: FilterOptions;
	setFilter: React.Dispatch<React.SetStateAction<FilterOptions>>;
}

export default function RepatriatedTableFilter({
	filter: initFilter,
	setFilter: setInitFilter,
}: RepatriatedTableFilterProps) {
	const [filter, setFilter] = useState<FilterOptions>(initFilter ?? {});

	return (
		<TableFilter
			filters={[
				{
					component: "input",
					label: "ตั้งแต่วันที่ส่งกลับ",
					type: "date",
					value: filter.startDate ?? "",
					onChange: (e) => setFilter((prev) => ({ ...prev, startDate: e.target.value })),
				},
				{
					component: "input",
					label: "ถึงวันที่ส่งกลับ",
					type: "date",
					value: filter.endDate ?? "",
					onChange: (e) => setFilter((prev) => ({ ...prev, endDate: e.target.value })),
				},
				{
					component: "input",
					label: "ตั้งแต่วันเกิด",
					type: "date",
					value: filter.dobStart ?? "",
					onChange: (e) => setFilter((prev) => ({ ...prev, dobStart: e.target.value })),
				},
				{
					component: "input",
					label: "ถึงวันเกิด",
					type: "date",
					value: filter.dobEnd ?? "",
					onChange: (e) => setFilter((prev) => ({ ...prev, dobEnd: e.target.value })),
				},
				{
					component: "nativeselect",
					label: "สถานะผู้เสียหาย",
					value: filter.isVictim ?? "",
					onChange: (e) => setFilter((prev) => ({ ...prev, isVictim: e.target.value })),
					options: [
						{ label: "ทั้งหมด" },
						{ label: "เป็นผู้เสียหาย", value: "YES" },
						{ label: "ไม่เป็นผู้เสียหาย", value: "NO" },
						{ label: "ไม่คัดกรองสถานะ", value: "PENDING" },
					],
				},
			]}
			handleClear={() => {
				setFilter({});
			}}
			handleSave={() => setInitFilter(filter)}
		>
			<Button variant="outline">Filter</Button>
		</TableFilter>
	);
}
