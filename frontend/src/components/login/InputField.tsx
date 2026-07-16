import React from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
	icon: React.ReactNode;
	rightElement?: React.ReactNode;
}

export const InputField: React.FC<InputFieldProps> = ({ label, icon, rightElement, ...props }) => {
	return (
		<div className="space-y-2">
			<label className="text-foreground flex items-center gap-2 text-sm font-medium">
				{icon} {label}
			</label>
			<div className="relative">
				<input
					className="text-foreground w-full rounded-xl border border-(--shadow) bg-(--button) px-4 py-3 transition-all outline-none focus:ring-2 focus:ring-(--header-bg)"
					{...props}
				/>
				{rightElement && (
					<div className="absolute top-1/2 right-3 -translate-y-1/2">{rightElement}</div>
				)}
			</div>
		</div>
	);
};
