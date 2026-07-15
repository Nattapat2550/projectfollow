import React from "react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	loading: boolean;
	loadingText?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
	loading,
	loadingText = "กำลังโหลด...",
	children,
	...props
}) => {
	return (
		<button
			type="submit"
			disabled={loading}
			className={`w-full rounded-xl py-4 font-bold text-(--greenText) transition-all hover:scale-[1.02] active:scale-[0.98] ${loading ? "cursor-not-allowed bg-(--greyBG)" : "border-2 border-(--greenBorder) bg-(--greenBG)"}`}
			{...props}
		>
			{loading ?
				<div className="flex items-center justify-center gap-2">
					<div className="h-5 w-5 animate-spin rounded-full border border-white border-t-transparent"></div>
					{loadingText}
				</div>
			:	children}
		</button>
	);
};
