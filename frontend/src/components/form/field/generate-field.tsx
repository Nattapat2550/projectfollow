import InputField, { InputFieldProps } from "./input";
import NativeSelectField, { NativeSelectFieldProps } from "./native-select";

export type GenerateFieldProps = InputFilter | SelectFilter;

type InputFilter = { component: "input" } & InputFieldProps;
type SelectFilter = { component: "nativeselect" } & NativeSelectFieldProps;

export function GenerateField(props: GenerateFieldProps) {
	switch (props.component) {
		case "nativeselect":
			return <NativeSelectField {...props} />;
		case "input":
			return <InputField {...props} />;
	}
}
