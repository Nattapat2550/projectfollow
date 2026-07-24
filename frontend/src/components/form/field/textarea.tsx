import React from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type TextareaFieldProps = React.ComponentProps<"textarea"> & {
	label: string;
	labelProps?: React.ComponentProps<"label">;
};

export default function TextareaField({
	label,
	labelProps,
	name,
	id = name || label,
	className,
	...props
}: TextareaFieldProps) {
	return (
		<Field>
			<FieldLabel {...labelProps} htmlFor={id} className={cn("text-header", labelProps?.className)}>
				{label}
			</FieldLabel>
			<Textarea {...props} id={id} name={name} className={cn("bg-background", className)} />
		</Field>
	);
}
