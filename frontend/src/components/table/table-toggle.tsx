"use client";

import { EyeIcon } from "lucide-react";
import * as React from "react";

import { FieldInfo, Info } from "@/components/table/table-header";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "../ui/button";

export default function TableToggle<T extends string>({
	children,
	isUpdating,
	fieldInfo,
	onChange: onCheckedChange,
}: {
	isUpdating?: boolean;
	children?: React.ReactNode;
	fieldInfo: FieldInfo<T>;
	onChange: (_name: T, _checked: boolean) => void;
}) {
	const isLimit =
		Object.entries<Info>(fieldInfo).reduce((prev, [, info]) => prev + (info.visible ? 1 : 0), 0)
		== 1;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{children ?? (
					<Button disabled={isUpdating} variant="outline">
						<EyeIcon />
						Toggle
					</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Toggle Visibility</DropdownMenuLabel>
					{Object.entries<Info>(fieldInfo).map(([name, { label, visible }]) => (
						<DropdownMenuCheckboxItem
							key={name}
							className="cursor-pointer"
							checked={visible}
							disabled={visible && isLimit}
							onCheckedChange={(checked) => onCheckedChange(name as T, checked)}
							onSelect={(e) => {
								e.preventDefault();
							}}
						>
							{label}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
