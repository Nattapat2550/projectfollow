"use client";
import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import React from "react";

import { AutocompleteOption } from "@/hooks/useAddressOptions";
import { cn } from "@/lib/utils";

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "../ui/combobox";
import { Field, FieldGroup, FieldLabel, FieldSet } from "../ui/field";
import { Input } from "../ui/input";
import { NativeSelect, NativeSelectOption } from "../ui/native-select";
import { Textarea } from "../ui/textarea";

export type FieldsLayout<T extends Record<string, string>> = {
	heading: string;
	inputs: (CustomField | PreBuiltField<T>)[][];
}[];

type CustomField = {
	label: string;
	input: React.ReactElement;
};
type PreBuiltField<T extends Record<string, string>> = {
	label: string;
	input?: undefined;
	name: keyof T;
} & (InputField | TextAreaField | SelectField | AutocompleteField);

type InputField = {
	component?: undefined;
	props?: React.ComponentProps<"input">;
};

type TextAreaField = {
	component: "textarea";
	props?: React.ComponentProps<"textarea">;
};

type SelectField = {
	component: "select";
	options: ({ label: string } & React.ComponentProps<"option">)[];
	props?: Omit<React.ComponentProps<"select">, "size"> & {
		size?: "sm" | "default";
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AutocompleteField<Value extends string | AutocompleteOption = any> = {
	component: "autocomplete";
	options: Value[];
	value: Value;
	onChange: (_value: Value | null) => void;
	props?: ComboboxPrimitive.Root.Props<Value>;
};

export default function CreateForm<T extends Record<string, string>>({
	formData,
	layout,
	handleInputChange,
}: {
	formData: T;
	layout: FieldsLayout<T>;
	handleInputChange: React.ChangeEventHandler;
}) {
	return (
		<FieldSet>
			{layout.map((e) => (
				<React.Fragment key={e.heading}>
					<FieldLabel className="mt-8 mb-4 text-xl font-bold text-(--header)">
						{e.heading}
					</FieldLabel>
					{e.inputs.map((group, idx) => (
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
							{group.map((i, idx) => (
								<Field key={idx}>
									<FieldLabel htmlFor={i.input ? undefined : String(i.name)}>{i.label}</FieldLabel>
									{i.input ?? (
										<PrebuiltField
											field={i}
											formData={formData}
											handleInputChange={handleInputChange}
										/>
									)}
									{/* <FieldError>Validation message.</FieldError> */}
								</Field>
							))}
						</FieldGroup>
					))}
				</React.Fragment>
			))}
		</FieldSet>
	);
}

function PrebuiltField<T extends Record<string, string>>({
	formData,
	handleInputChange,
	field,
}: {
	formData: T;
	handleInputChange: React.ChangeEventHandler;
	field: PreBuiltField<T>;
}) {
	switch (field.component) {
		default:
			return (
				<Input
					{...field.props}
					id={String(field.name)}
					name={String(field.name)}
					value={formData[field.name]}
					onChange={handleInputChange}
					type={field.props?.type ?? "text"}
					className={cn("bg-background", field.props?.className)}
				/>
			);
		case "textarea":
			return (
				<Textarea
					{...field.props}
					id={String(field.name)}
					name={String(field.name)}
					value={formData[field.name]}
					onChange={handleInputChange}
					className={cn("bg-background", field.props?.className)}
				/>
			);
		case "select":
			return (
				<NativeSelect
					{...field.props}
					id={String(field.name)}
					name={String(field.name)}
					value={formData[field.name]}
					onChange={handleInputChange}
					className={cn("bg-background", field.props?.className)}
				>
					{field.options.map((o, idx) => (
						<NativeSelectOption {...o} key={idx}>
							{o.label}
						</NativeSelectOption>
					))}
				</NativeSelect>
			);
		case "autocomplete":
			return (
				<Combobox
					items={field.options}
					itemToStringLabel={(o) => (typeof o == "string" ? o : o.value)}
					id={String(field.name)}
					name={String(field.name)}
					value={field.value || null}
					onValueChange={(value) => field.onChange(value)}
					autoHighlight
					limit={25}
				>
					<ComboboxInput placeholder={field.label} className="bg-background" showClear />
					<ComboboxContent>
						<ComboboxEmpty>No items found.</ComboboxEmpty>
						<ComboboxList>
							{(o, idx) => (
								<ComboboxItem key={idx} value={o}>
									{typeof o == "string" ? o : o.label}
								</ComboboxItem>
							)}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			);
	}
}
