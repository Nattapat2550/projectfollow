import { FilterIcon } from "lucide-react";
import React from "react";

import { GenerateField, GenerateFieldProps } from "../form/field/generate-field";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { FieldSet } from "../ui/field";

export default function TableFilter({
	filters,
	filterCount,
	handleClear,
	handleSave,
	children,
}: {
	filters: GenerateFieldProps[];
	filterCount?: number;
	handleClear: React.MouseEventHandler;
	handleSave: React.MouseEventHandler;
	children?: React.ReactNode;
}) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				{children ?? (
					<Button variant="outline">
						<FilterIcon size={16} />
						Filter {filterCount !== undefined && `(${filterCount})`}
					</Button>
				)}
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Filter Data</DialogTitle>
				</DialogHeader>
				<div className="-mx-4 max-h-[50vh] overflow-y-auto px-4">
					<FieldSet>
						{filters.map((props, idx) => (
							<GenerateField {...props} key={idx} />
						))}
					</FieldSet>
				</div>
				<DialogFooter>
					<Button onClick={handleClear} variant="destructive">
						Clear
					</Button>
					<DialogClose asChild>
						<Button onClick={handleSave}>Save changes</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
