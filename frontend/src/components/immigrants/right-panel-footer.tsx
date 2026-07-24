import React from "react";

import { cn } from "@/lib/utils";

export default function RightPanelFooter({
	isDeleting,
	handleEdit,
	handleDelete,
}: {
	isDeleting: boolean;
	handleEdit: React.MouseEventHandler;
	handleDelete: React.MouseEventHandler;
}) {
	return (
		<div className="grid grid-cols-2 gap-4">
			<button
				onClick={handleEdit}
				className="cursor-pointer rounded-lg border border-(--yellowBorder) bg-(--yellowBG) py-2.5 text-center text-sm font-bold text-(--yellowText) shadow-sm transition hover:opacity-90 active:scale-95"
			>
				แก้ไขข้อมูล
			</button>

			<button
				onClick={handleDelete}
				disabled={isDeleting}
				className={cn(
					`rounded-lg border border-(--redBorder) bg-(--redBG) py-2.5 text-center text-sm font-bold text-(--redText) shadow-sm transition hover:opacity-90 active:scale-95`,
					isDeleting ? "cursor-not-allowed opacity-40" : "cursor-pointer"
				)}
			>
				{isDeleting ? "กำลังลบ..." : "ลบข้อมูล"}
			</button>
		</div>
	);
}
