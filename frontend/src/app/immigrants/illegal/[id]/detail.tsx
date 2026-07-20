"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { IllegalDetail } from "@/hooks/useIllegalDetail";
import { cn } from "@/lib/utils";

import IllegalIDPageCard from "./card";
import IllegalIDPageEditForm from "./form";

export default function IllegalIDPageDetail({ detail }: { detail: IllegalDetail }) {
	const { states, actions } = detail;

	return (
		<div className="bg-background text-foreground min-h-screen p-6 transition-colors duration-200">
			<div className="mx-auto mb-6 max-w-7xl">
				{states.isEditing ?
					<button
						onClick={() => actions.setIsEditing(false)}
						className="flex cursor-pointer items-center gap-1 text-2xl font-bold text-(--header) transition hover:opacity-80"
					>
						<ChevronLeft size={32} />
						<span>แก้ไขฟอร์ม</span>
					</button>
				:	<Link
						href={`/immigrants/illegal`}
						className="flex cursor-pointer items-center gap-1 text-2xl font-bold text-(--header) transition hover:opacity-80"
					>
						<ChevronLeft size={32} />
						<span>รายละเอียด</span>
					</Link>
				}
			</div>

			{states.isEditing ?
				<IllegalIDPageEditForm detail={detail} />
			:	<div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-12">
					<div className="w-full lg:col-span-7 xl:col-span-8">
						<IllegalIDPageCard data={detail.states.initData} />
					</div>
					<div className="w-full lg:col-span-5 xl:col-span-4">
						<RightPanel detail={detail} />
					</div>
				</div>
			}
		</div>
	);
}

function RightPanel({ detail }: { detail: IllegalDetail }) {
	const { states, actions, handlers } = detail;
	const data = states.initData;

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="rounded-2xl border border-(--wrapper) bg-(--container) p-6 shadow-sm transition-colors">
				<div className="flex flex-col gap-3">
					<h3 className="mb-2 text-xl font-bold text-(--header)">ข้อมูลคัดกรอง</h3>

					<div
						className={cn(
							`w-full rounded-lg border px-4 py-2 text-center text-sm font-bold shadow-sm`,
							data?.is_victim === "YES" ? "border-red-300 bg-red-100 text-red-700"
							: data?.is_victim === "NO" ? "border-emerald-300 bg-emerald-100 text-emerald-700"
							: "border-(--yellowBorder) bg-(--yellowBG) text-(--yellowText)"
						)}
					>
						{data?.is_victim === "YES" ?
							"เข้าข่ายเป็นผู้เสียหายจากการค้ามนุษย์"
						: data?.is_victim === "NO" ?
							"ไม่เป็นผู้เสียหายจากการค้ามนุษย์"
						:	"ไม่คัดกรองสถานะ"}
					</div>

					<div className="bg-background text- (--foreground) ]dark:text-slate-300 mt-2 min-h-15 rounded-md border border-(--wrapper) p-3 text-xs leading-relaxed font-medium whitespace-pre-wrap shadow-inner">
						{data?.screening_details || "ไม่มีรายละเอียดการคัดกรองระบุไว้"}
					</div>
				</div>

				<div className="mt-6 flex flex-col gap-2 border-t border-(--wrapper) pt-4">
					<label className="text-lg font-bold text-(--header)">หมายเหตุระบบ</label>
					<textarea
						value={states.note}
						onChange={(e) => actions.setNote(e.target.value)}
						rows={3}
						className="bg-background text-foreground w-full rounded-md border border-(--wrapper) p-3 text-xs shadow-inner focus:ring-2 focus:ring-(--header)/40 focus:outline-none"
						placeholder="ไม่มีบันทึกหมายเหตุ..."
					/>
					<button
						onClick={handlers.handleSaveNote}
						disabled={states.isSavingNote}
						className="text-foreground mt-1 w-full cursor-pointer rounded-md bg-(--wrapper) py-2 text-xs font-bold shadow-sm transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{states.isSavingNote ? "กำลังบันทึก..." : "บันทึก/อัปเดตหมายเหตุ"}
					</button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<button
					onClick={() => actions.setIsEditing(true)}
					className="cursor-pointer rounded-lg border border-(--yellowBorder) bg-(--yellowBG) py-2.5 text-center text-sm font-bold text-(--yellowText) shadow-sm transition hover:opacity-90 active:scale-95"
				>
					แก้ไขข้อมูล
				</button>

				<button
					onClick={handlers.handleDelete}
					disabled={states.isDeleting}
					className={cn(
						`rounded-lg border border-(--redBorder) bg-(--redBG) py-2.5 text-center text-sm font-bold text-(--redText) shadow-sm transition hover:opacity-90 active:scale-95`,
						states.isDeleting ? "cursor-not-allowed opacity-40" : "cursor-pointer"
					)}
				>
					{states.isDeleting ? "กำลังลบ..." : "ลบข้อมูล"}
				</button>
			</div>
		</div>
	);
}
