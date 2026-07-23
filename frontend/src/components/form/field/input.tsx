import React from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type InputFieldProps = React.ComponentProps<"input"> & {
	label: string;
	labelProps?: React.ComponentProps<"label">;
};

export default function InputField({
	label,
	labelProps,
	id = label,
	className,
	...props
}: InputFieldProps) {
	return (
		<Field>
			<FieldLabel {...labelProps} htmlFor={id} className={cn("text-header", labelProps?.className)}>
				{label}
			</FieldLabel>
			<Input {...props} id={id} className={cn("bg-background", className)} />
		</Field>
	);
}
