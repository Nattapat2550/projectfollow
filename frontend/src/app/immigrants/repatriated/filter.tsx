"use client";

import { useState } from "react";

import { GenerateFieldProps } from "@/components/form/field/generate-field";
import TableFilter from "@/components/table/table-filter";
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

	const filterCount = Object.entries(filter).reduce((prev, [, value]) => prev + (value ? 1 : 0), 0);

	const filters: GenerateFieldProps[] = [
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
