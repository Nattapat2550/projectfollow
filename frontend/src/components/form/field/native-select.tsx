import React from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption, NativeSelectProps } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export type NativeSelectFieldProps = NativeSelectProps & {
	label: string;
	labelProps?: React.ComponentProps<"label">;
	options: React.ComponentProps<"option">[];
};

export default function NativeSelectField({
	label,
	labelProps,
	name,
	id = name || label,
	options,
	...props
}: NativeSelectFieldProps) {
	return (
		<Field>
			<FieldLabel {...labelProps} htmlFor={id} className={cn("text-header", labelProps?.className)}>
				{label}
			</FieldLabel>
			<NativeSelect {...props} id={id} name={name} className={cn("bg-background", props.className)}>
				{options.map((option, idx) => (
					<NativeSelectOption {...option} key={idx} />
				))}
			</NativeSelect>
		</Field>
	);
}
