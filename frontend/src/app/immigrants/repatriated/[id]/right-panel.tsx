import RightPanelFooter from "@/components/immigrants/right-panel-footer";
import RightPanelPassportCard from "@/components/immigrants/right-panel-passport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RepatriatedDetail } from "@/hooks/useRepatriatedDetail";

export default function RepatriatedIDPageDetailRightPanel({
	detail,
}: {
	detail: RepatriatedDetail;
}) {
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
		<Tabs defaultValue="info">
			<TabsList>
				<TabsTrigger value="info">ข้อมูลคัดกรอง</TabsTrigger>
				<TabsTrigger value="passport">หนังสือเดินทาง</TabsTrigger>
			</TabsList>
			<TabsContent value="info">
				<div className="flex w-full flex-col gap-6">
					<div className="border-wrapper rounded-2xl border bg-(--container) p-6 shadow-sm transition-colors">
						<div className="flex flex-col gap-3">
							<h3 className="text-header mb-2 text-xl font-bold">ข้อมูลเพิ่มเติม</h3>

							<div className="border-wrapper flex items-center justify-between border-b pb-2 text-sm">
								<span className="text- (--foreground) ]dark:text-slate-300 font-bold">
									วันที่ส่งกลับ
								</span>
								<span className="font-mono font-semibold">
									{formatDate(states.initData?.return_date)}
								</span>
							</div>

							<div className="border-wrapper flex items-center justify-between border-b pb-2 text-sm">
								<span className="text- (--foreground) ]dark:text-slate-300 font-bold">
									จำนวน Case ID
								</span>
								<span className="font-mono font-semibold">
									{states.initData?.number_of_case ?? 0}
								</span>
							</div>

							<div className="border-wrapper flex items-center justify-between border-b pb-2 text-sm">
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
