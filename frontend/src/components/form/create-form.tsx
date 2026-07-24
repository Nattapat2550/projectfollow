"use client";
import React from "react";

import { cn } from "@/lib/utils";

import { FieldGroup, FieldLabel, FieldSet } from "../ui/field";
import { ComboboxComponent, GenerateField, GenerateFieldProps } from "./field/generate-field";

export type FormLayout<T extends Record<string, string>> = {
	heading: string;
	props: ({ name?: Extract<keyof T, string> } & GenerateFieldProps)[][];
}[];

export type FormComboboxProps<Value, T extends Record<string, string>> = {
	name?: Extract<keyof T, string>;
} & ComboboxComponent<Value>;

export default function CreateForm2<T extends Record<string, string>>({
	formData,
	layout,
	handleInputChange,
}: {
	formData: T;
	layout: FormLayout<T>;
	handleInputChange: React.ChangeEventHandler;
}) {
	return (
		<div>
			{layout.map((set) => (
				<FieldSet key={set.heading}>
					<FieldLabel className="text-header mt-8 mb-4 text-xl font-bold">{set.heading}</FieldLabel>
					{set.props.map((group, idx) => (
						<FieldGroup
							className={cn(
								"mb-5 grid grid-cols-1 gap-5",
								group.length > 1 ?
									group.length == 2 ? `md:grid-cols-2`
									: group.length == 3 ? `md:grid-cols-3`
									: group.length == 4 ? `md:grid-cols-4`
									: `md:grid-cols-5`
								:	""
							)}
							key={idx}
						>
							{group.map((field, idx) => {
								if (field.component == "custom" || field.component == "combobox") {
									return <GenerateField {...field} key={idx} />;
								} else {
									return (
										<GenerateField
											{...field}
											value={field.name ? formData[field.name] : undefined}
											onChange={field.name ? handleInputChange : undefined}
											key={idx}
										/>
									);
								}
							})}
						</FieldGroup>
					))}
				</FieldSet>
			))}
		</div>
	);
}
