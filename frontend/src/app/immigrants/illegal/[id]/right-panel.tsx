import RightPanelFooter from "@/components/immigrants/right-panel-footer";
import RightPanelPassportCard from "@/components/immigrants/right-panel-passport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IllegalDetail } from "@/hooks/useIllegalDetail";
import { cn } from "@/lib/utils";

export default function IllegalIDPageDetailRightPanel({ detail }: { detail: IllegalDetail }) {
	const { states, actions, handlers } = detail;
	const data = states.initData;

	return (
		<Tabs defaultValue="info">
			<TabsList>
				<TabsTrigger value="info">ข้อมูลคัดกรอง</TabsTrigger>
				<TabsTrigger value="passport">หนังสือเดินทาง</TabsTrigger>
			</TabsList>
			<TabsContent value="info">
				<div className="flex w-full flex-col gap-6">
					<div className="border-wrapper rounded-2xl border bg-(--container) p-6 shadow-sm transition-colors">
						<div className="flex flex-col gap-3">
							<h3 className="text-header mb-2 text-xl font-bold">ข้อมูลคัดกรอง</h3>

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

							<div className="bg-background text- (--foreground) ]dark:text-slate-300 border-wrapper mt-2 min-h-15 rounded-md border p-3 text-xs leading-relaxed font-medium whitespace-pre-wrap shadow-inner">
								{data?.screening_details || "ไม่มีรายละเอียดการคัดกรองระบุไว้"}
							</div>
						</div>

						<div className="border-wrapper mt-6 flex flex-col gap-2 border-t pt-4">
							<label className="text-header text-lg font-bold">หมายเหตุระบบ</label>
							<textarea
								value={states.note}
								onChange={(e) => actions.setNote(e.target.value)}
								rows={3}
								className="bg-background text-foreground border-wrapper w-full rounded-md border p-3 text-xs shadow-inner focus:ring-2 focus:ring-(--header)/40 focus:outline-none"
								placeholder="ไม่มีบันทึกหมายเหตุ..."
							/>
							<button
								onClick={handlers.handleSaveNote}
								disabled={states.isSavingNote}
								className="text-foreground bg-wrapper mt-1 w-full cursor-pointer rounded-md py-2 text-xs font-bold shadow-sm transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{states.isSavingNote ? "กำลังบันทึก..." : "บันทึก/อัปเดตหมายเหตุ"}
							</button>
						</div>
					</div>
				</div>
			</TabsContent>
			<TabsContent value="passport">
				<RightPanelPassportCard passport_photo_url={states.initData?.passport_photo_url} />
			</TabsContent>
			<RightPanelFooter
				isDeleting={states.isDeleting}
				handleEdit={() => actions.setIsEditing(true)}
				handleDelete={handlers.handleDelete}
			/>
		</Tabs>
	);
}
