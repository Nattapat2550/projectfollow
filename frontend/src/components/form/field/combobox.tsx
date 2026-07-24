import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import React from "react";

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type ComboboxItemProps<Value> = ComboboxPrimitive.Item.Props & {
	label: string;
	value: Value;
};

export type ComboboxFieldProps<Value> = Omit<ComboboxPrimitive.Root.Props<Value>, "items"> & {
	label: string;
	items: ComboboxPrimitive.Root.Props<Value>["items"];
	optionsFunc: (_item: Value, _index: number) => ComboboxItemProps<Value>;
	labelProps?: React.ComponentProps<"label">;
	inputProps?: React.ComponentProps<typeof ComboboxInput>;
	comboboxListProps?: Omit<React.ComponentProps<typeof ComboboxList>, "children">;
	emptyLabel?: string;
};

export default function ComboboxField<Value>({
	label,
	optionsFunc,
	labelProps,
	inputProps,
	comboboxListProps,
	emptyLabel = "No items found.",
	name,
	id = name || label,
	...props
}: ComboboxFieldProps<Value>) {
	return (
		<Field>
			<FieldLabel {...labelProps} htmlFor={id} className={cn("text-header", labelProps?.className)}>
				{label}
			</FieldLabel>
			<Combobox {...props} id={id} name={name}>
				<ComboboxInput {...inputProps} className={cn("bg-background", inputProps?.className)} />
				<ComboboxContent>
					<ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
					<ComboboxList {...comboboxListProps}>
						{(o, idx) => {
							const { label, ...props } = optionsFunc(o, idx);
							return (
								<ComboboxItem {...props} key={idx}>
									{label}
								</ComboboxItem>
							);
						}}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</Field>
	);
}
