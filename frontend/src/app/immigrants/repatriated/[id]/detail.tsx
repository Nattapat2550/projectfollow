"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import UniversalImmigrantCard from "@/components/immigrants/UniversalImmigrantCard";
import { RepatriatedDetail } from "@/hooks/useRepatriatedDetail";
import { cn } from "@/lib/utils";

import RepatriatedIDPageEditForm from "./form";

export default function RepatriatedIDPageDetail({ detail }: { detail: RepatriatedDetail }) {
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
						href={`/immigrants/repatriated`}
						className="flex cursor-pointer items-center gap-1 text-2xl font-bold text-(--header) transition hover:opacity-80"
					>
						<ChevronLeft size={32} />
						<span>รายละเอียด</span>
					</Link>
				}
			</div>

			{states.isEditing ?
				<RepatriatedIDPageEditForm detail={detail} />
			:	<div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 lg:grid-cols-12">
					<div className="w-full lg:col-span-7 xl:col-span-8">
						<UniversalImmigrantCard data={states.initData} type={"repatriated"} />
					</div>
					<div className="w-full lg:col-span-5 xl:col-span-4">
						<RightPanel detail={detail} />
					</div>
				</div>
			}
		</div>
	);
}

function RightPanel({ detail }: { detail: RepatriatedDetail }) {
	const { states, actions, handlers } = detail;

	const formatDate = (dateStr: string | null | undefined) => {
		if (!dateStr) return "-";
		return new Date(dateStr).toLocaleDateString("th-TH", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="rounded-2xl border border-(--wrapper) bg-(--container) p-6 shadow-sm transition-colors">
				<div className="flex flex-col gap-3">
					<h3 className="mb-2 text-xl font-bold text-(--header)">ข้อมูลเพิ่มเติม</h3>

					<div className="flex items-center justify-between border-b border-(--wrapper) pb-2 text-sm">
						<span className="text- (--foreground) ]dark:text-slate-300 font-bold">
							วันที่ส่งกลับ
						</span>
						<span className="font-mono font-semibold">
							{formatDate(states.initData?.return_date)}
						</span>
					</div>

					<div className="flex items-center justify-between border-b border-(--wrapper) pb-2 text-sm">
						<span className="text- (--foreground) ]dark:text-slate-300 font-bold">
							จำนวน Case ID
						</span>
						<span className="font-mono font-semibold">{states.initData?.number_of_case ?? 0}</span>
					</div>

					<div className="flex items-center justify-between border-b border-(--wrapper) pb-2 text-sm">
						<span className="text- (--foreground) ]dark:text-slate-300 font-bold">
							จำนวนหมายจับ
						</span>
						<span
							className={`font-mono font-semibold ${(states.initData?.number_of_warrant || 0) > 0 ? "text-(--redText)" : ""}`}
						>
							{states.initData?.number_of_warrant ?? 0}
						</span>
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
					onClick={() => {
						actions.setIsEditing(true);
					}}
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
