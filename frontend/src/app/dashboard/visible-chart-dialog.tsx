import React from "react";

export default function DashboardPageDialog({
	type,
	open,
	setOpen,
	visibleCharts,
	setVisibleCharts,
}: {
	type: "illegal" | "repatriated";
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	visibleCharts: string[];
	setVisibleCharts: React.Dispatch<React.SetStateAction<string[]>>;
}) {
	const saveVisibleCharts = (chartsList: string[]) => {
		setVisibleCharts(chartsList);
		const date = new Date();
		date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
		document.cookie = `dashboard_visible_charts=${chartsList.join(",")}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
	};

	const toggleChart = (key: string) => {
		const isVisible = visibleCharts.includes(key);
		const updated = isVisible ? visibleCharts.filter((k) => k !== key) : [...visibleCharts, key];
		saveVisibleCharts(updated);
	};

	return (
		open && (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
				<div className="relative w-full max-w-md rounded-md border border-(--wrapper) bg-(--container) p-6 shadow-2xl">
					<h4 className="text-header mb-4 text-lg font-bold">⚙️ ตั้งค่าความน่าสนใจของกราฟ</h4>
					<p className="text-header mb-4 text-sm opacity-80">
						เลือกกราฟที่ต้องการให้แสดงผลบนแดชบอร์ดหลัก:
					</p>

					<div className="mb-6 flex flex-col gap-3">
						{type === "illegal" ?
							<>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("dateTrend")}
										onChange={() => toggleChart("dateTrend")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									แนวโน้มวันที่ (รายเดือน)
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("nationality")}
										onChange={() => toggleChart("nationality")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									สัญชาติ (Top 6)
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("region")}
										onChange={() => toggleChart("region")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									ภาค
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("province")}
										onChange={() => toggleChart("province")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									จังหวัด (Top 6)
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("ageGroup")}
										onChange={() => toggleChart("ageGroup")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									ช่วงอายุ
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("gender")}
										onChange={() => toggleChart("gender")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									เพศ
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("victim")}
										onChange={() => toggleChart("victim")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									สถานะผู้เสียหาย
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("passport")}
										onChange={() => toggleChart("passport")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									สถานะหนังสือเดินทาง
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("creator")}
										onChange={() => toggleChart("creator")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									ผู้เพิ่มข้อมูล
								</label>
							</>
						:	<>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("dateTrend")}
										onChange={() => toggleChart("dateTrend")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									แนวโน้มวันที่ (รายเดือน)
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("nationality")}
										onChange={() => toggleChart("nationality")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									สัญชาติ (Top 6)
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("region")}
										onChange={() => toggleChart("region")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									ภาค
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("province")}
										onChange={() => toggleChart("province")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									จังหวัด (Top 6)
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("ageGroup")}
										onChange={() => toggleChart("ageGroup")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									ช่วงอายุ
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("gender")}
										onChange={() => toggleChart("gender")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									เพศ
								</label>
								<label className="text-header flex cursor-pointer items-center gap-3 text-sm font-semibold select-none">
									<input
										type="checkbox"
										checked={visibleCharts.includes("creator")}
										onChange={() => toggleChart("creator")}
										className="h-4 w-4 accent-(--blueText)"
									/>
									ผู้เพิ่มข้อมูล
								</label>
							</>
						}
					</div>

					<div className="flex justify-end gap-2">
						<button
							onClick={() =>
								saveVisibleCharts([
									"nationality",
									"region",
									"province",
									"gender",
									"victim",
									"passport",
									"creator",
									"ageGroup",
									"dateTrend",
								])
							}
							className="text-header cursor-pointer rounded bg-zinc-200 px-3.5 py-1.5 text-sm font-bold transition select-none hover:opacity-80 dark:bg-zinc-800"
						>
							แสดงผลทั้งหมด
						</button>
						<button
							onClick={() => setOpen(false)}
							className="cursor-pointer rounded bg-(--blueText) px-5 py-1.5 text-sm font-bold text-(--button) transition select-none hover:opacity-90"
						>
							ตกลง
						</button>
					</div>
				</div>
			</div>
		)
	);
}
