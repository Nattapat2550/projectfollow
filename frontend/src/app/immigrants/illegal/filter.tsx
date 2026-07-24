"use client";

import { useState } from "react";

import { GenerateFieldProps } from "@/components/form/field/generate-field";
import TableFilter from "@/components/table/table-filter";
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

	const filterCount = Object.entries(filter).reduce((prev, [, value]) => prev + (value ? 1 : 0), 0);

	const filters: GenerateFieldProps[] = [
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
	];

	return (
		<TableFilter
			filterCount={filterCount}
			filters={filters}
			handleClear={() => {
				setFilter({});
			}}
			handleSave={() => {
				setInitFilter(filter);
			}}
		/>
	);
}
