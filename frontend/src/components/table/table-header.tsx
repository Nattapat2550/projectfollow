"use client";

import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

export type FieldInfo<T extends string> = Record<T, Info>;

export type Info = {
	label: string;
	visible: boolean;
	headerProps?: React.ComponentPropsWithoutRef<"th">;
};

export interface TableHeaderProps<T extends string> {
	fields: FieldInfo<T>;
	sortField: T | null;
	sortDirection: "asc" | "desc";
	onSort: (_field: T) => void;
	isExportMode?: boolean;
	isSelectingAll?: boolean;
	onSelectAll?: (_selectAll: boolean) => void;
}

export default function TableHeader<T extends string>({
	fields,
	sortDirection,
	sortField,
	onSort,
	isExportMode,
	isSelectingAll,
	onSelectAll,
}: TableHeaderProps<T>) {
	return (
		<thead>
			<tr style={{ borderBottom: "1px solid var(--wrapper)" }}>
				{isExportMode && (
					<th
						className="w-12.5 shrink-0 border-r px-4 py-3 text-center"
						style={{
							backgroundColor: "var(--container)",
							borderColor: "var(--wrapper)",
						}}
					>
						<input
							type="checkbox"
							className="h-4 w-4 cursor-pointer accent-(--blueText)"
							checked={isSelectingAll}
							onChange={(e) => onSelectAll?.(e.target.checked)}
						/>
					</th>
				)}
				{Object.entries(fields)
					.filter(([, info]) => (info as Info).visible)
					.map(([name, _info]) => {
						const info = _info as Info;
						return (
							<TableHeaderCell
								key={name}
								name={name as T}
								onSort={onSort}
								sortDirection={sortDirection}
								sortField={sortField}
								props={{ ...info.headerProps, title: info.label }}
							>
								{info.label}
							</TableHeaderCell>
						);
					})}
			</tr>
		</thead>
	);
}

function TableHeaderCell<T extends string>({
	name,
	children,
	sortField,
	sortDirection,
	onSort,
	props,
}: {
	name: T;
	children: React.ReactNode;
	sortField: T | null;
	sortDirection: "asc" | "desc";
	onSort: (_field: T) => void;
	props?: React.ComponentPropsWithoutRef<"th">;
}) {
	return (
		<th
			{...props}
			onClick={() => onSort(name)}
			className={cn(
				`cursor-pointer truncate border-r px-4 py-3 text-left font-semibold select-none last:border-r-0`,
				props?.className
			)}
			style={{
				backgroundColor: "var(--container)",
				color: "var(--foreground)",
				borderColor: "var(--wrapper)",
			}}
		>
			<div className="flex items-center gap-1 truncate">
				<span className="truncate">{children}</span>
				{sortField === name ?
					sortDirection === "asc" ?
						<ChevronUp className="h-4 w-4 shrink-0" />
					:	<ChevronDown className="h-4 w-4 shrink-0" />
				:	<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-40" />}
			</div>
		</th>
	);
}
