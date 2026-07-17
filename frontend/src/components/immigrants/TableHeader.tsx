import { ChevronDown, ChevronUp } from "lucide-react";

export type SortField =
	| "name"
	| "date_of_birth"
	| "detected_date"
	| "national_id"
	| "nationality"
	| "address"
	| "detected_location"
	| "is_victim"
	| "return_date";

interface TableHeaderProps {
	sortField: SortField | null;
	sortDirection: "asc" | "desc";
	onSort: (field: SortField) => void;
	type: "repatriated" | "illegal";
}

export default function TableHeader({ sortField, sortDirection, onSort, type }: TableHeaderProps) {
	const renderSortIcon = (field: SortField) => {
		if (sortField !== field)
			return <span className="ml-1 inline-block w-4 shrink-0 text-transparent">↕</span>;
		return sortDirection === "asc" ?
				<ChevronUp className="text-foreground ml-1 inline-block h-4 w-4 shrink-0" />
			:	<ChevronDown className="text-foreground ml-1 inline-block h-4 w-4 shrink-0" />;
	};

	const Th = ({
		field,
		children,
		className = "",
	}: {
		field: SortField;
		children: React.ReactNode;
		className?: string;
	}) => (
		<th
			onClick={() => onSort(field)}
			className={`hover:bg-muted/50 cursor-pointer truncate p-4 font-semibold text-(--header) select-none ${className}`}
			title={children as string}
		>
			<div className="flex items-center truncate">
				<span className="truncate">{children}</span>
				{renderSortIcon(field)}
			</div>
		</th>
	);

	if (type === "illegal") {
		return (
			<thead className="bg-muted/30 border-b border-(--wrapper)">
				<tr>
					<Th field="name" className="w-[20%]">
						ชื่อ - นามสกุล
					</Th>
					<Th field="nationality" className="w-[15%]">
						สัญชาติ
					</Th>
					<Th field="detected_date" className="w-[15%]">
						วันที่ตรวจพบ
					</Th>
					<Th field="detected_location" className="w-[25%]">
						สถานที่ตรวจพบ
					</Th>
					<Th field="is_victim" className="w-[15%]">
						สถานะผู้เสียหาย
					</Th>
					<th className="w-[10%] truncate p-4 font-semibold text-(--header)">จัดการ</th>
				</tr>
			</thead>
		);
	}

	return (
		<thead className="bg-muted/30 border-b border-(--wrapper)">
			<tr>
				<Th field="name" className="w-[20%]">
					ชื่อ - นามสกุล
				</Th>
				<Th field="date_of_birth" className="w-[15%]">
					วันเกิด (อายุ)
				</Th>
				<Th field="national_id" className="w-[15%]">
					เลขประจำตัว
				</Th>
				<Th field="address" className="w-[20%]">
					สถานที่ตรวจพบ
				</Th>
				<Th field="return_date" className="w-[10%]">
					วันที่ส่งกลับ
				</Th>
				<Th field="is_victim" className="w-[10%]">
					สถานะผู้เสียหาย
				</Th>
				<th className="w-[10%] truncate p-4 font-semibold text-(--header)">จัดการ</th>
			</tr>
		</thead>
	);
}
