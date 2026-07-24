/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";

import ComboboxField, { ComboboxFieldProps } from "./combobox";
import InputField, { InputFieldProps } from "./input";
import NativeSelectField, { NativeSelectFieldProps } from "./native-select";
import TextareaField, { TextareaFieldProps } from "./textarea";

export type GenerateFieldProps =
	| InputComponent
	| TextareaComponent
	| SelectComponent
	| ComboboxComponent
	| CustomComponent;

export type InputComponent = { component: "input" } & InputFieldProps;
export type TextareaComponent = { component: "textarea" } & TextareaFieldProps;
export type SelectComponent = { component: "nativeselect" } & NativeSelectFieldProps;
export type ComboboxComponent<Value = any> = { component: "combobox" } & ComboboxFieldProps<Value>;
export type CustomComponent = { component: "custom" } & CustomComponentProps;
export type CustomComponentProps = { render: React.ReactElement };

export function GenerateField(props: GenerateFieldProps) {
	switch (props.component) {
		case "input":
			return <InputField {...props} />;
		case "nativeselect":
			return <NativeSelectField {...props} />;
		case "textarea":
			return <TextareaField {...props} />;
		case "combobox":
			return <ComboboxField {...props} />;
		case "custom":
			return props.render;
	}
}
