"use client";

import { useState } from "react";

import TableFilter from "@/components/table/table-filter";
import { Button } from "@/components/ui/button";
import { GetAllIllegalRequestQuery } from "@/lib/schema/illegal";

export type FilterOptions = Pick<GetAllIllegalRequestQuery, "startDate" | "endDate" | "isVictim">;
export interface IllegalTableFilterProps {
	filter: FilterOptions;
	setFilter: React.Dispatch<React.SetStateAction<FilterOptions>>;
}

export default function IllegalTableFilter({
	filter: initFilter,
	setFilter: setInitFilter,
}: IllegalTableFilterProps) {
	const [filter, setFilter] = useState<FilterOptions>(initFilter ?? {});

	return (
		<TableFilter
			filters={[
				{
					component: "input",
					label: "ตั้งแต่วันที่ตรวจพบ",
					type: "date",
					value: filter.startDate ?? "",
					onChange: (e) => setFilter((prev) => ({ ...prev, startDate: e.target.value })),
				},
				{
					component: "input",
					label: "ถึงวันที่ตรวจพบ",
					type: "date",
					value: filter.endDate ?? "",
					onChange: (e) => setFilter((prev) => ({ ...prev, endDate: e.target.value })),
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
