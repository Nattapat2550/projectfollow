"use client";

import React, { ChangeEventHandler } from "react";

import AutocompleteInput, { AutocompleteInputProps } from "@/components/ui/AutocompleteInput";
import { cn } from "@/lib/utils";

const inputClass =
	"w-full border px-3 py-1.5 text-sm rounded-sm bg-background !text-black dark:!text-white border-(--wrapper) focus:outline-none transition-all dark:[color-scheme:dark]";
const labelClass = "block text-xs font-semibold mb-1.5 !text-black dark:!text-white opacity-80";

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
} & Omit<React.ComponentProps<"input">, "name">;

type TextAreaField = {
	component: "textarea";
} & Omit<React.ComponentProps<"textarea">, "name">;

type SelectField = {
	component: "select";
	options: ({ label: string } & React.ComponentProps<"option">)[];
} & Omit<React.ComponentProps<"select">, "name">;

type AutocompleteField = {
	component: "autocomplete";
} & Omit<AutocompleteInputProps, "value" | "onChange">;

export default function CreateForm<T extends Record<string, string>>({
	formData,
	layout,
	handleInputChange,
}: {
	formData: T;
	layout: FieldsLayout<T>;
	handleInputChange: React.ChangeEventHandler;
}) {
	return layout.map((e) => (
		<React.Fragment key={e.heading}>
			<h3 className="mt-8 mb-4 text-xl font-bold text-(--header)">{e.heading}</h3>
			{e.inputs.map((g, idx) => (
				<div
					className={cn(
						"mb-5 grid grid-cols-1 gap-5",
						g.length > 1 ?
							g.length == 2 ? `md:grid-cols-2`
							: g.length == 3 ? `md:grid-cols-3`
							: g.length == 4 ? `md:grid-cols-4`
							: `md:grid-cols-5`
						:	""
					)}
					key={idx}
				>
					{g.map((i, idx) => (
						<div key={idx}>
							<label className={labelClass} htmlFor={i.input ? undefined : String(i.name)}>
								{i.label}
							</label>
							{i.input ?? (
								<PrebuiltField
									{...{
										...i,
										id: String(i.name),
										value: formData[i.name] ?? "",
										onChange: handleInputChange,
										className: inputClass,
									}}
								/>
							)}
						</div>
					))}
				</div>
			))}
		</React.Fragment>
	));
}

function PrebuiltField<T extends Record<string, string>>(
	props: PreBuiltField<T> & { value: string; onChange: ChangeEventHandler }
) {
	switch (props.component) {
		default:
			return <input {...props} name={String(props.name)} type={props.type ?? "text"} />;
		case "textarea":
			return <textarea {...props} name={String(props.name)} />;
		case "select":
			return (
				<select {...props} name={String(props.name)}>
					{props.options.map((o, idx) => (
						<option {...o} key={idx}>
							{o.label}
						</option>
					))}
				</select>
			);
		case "autocomplete":
			return <AutocompleteInput {...props} />;
	}
}
