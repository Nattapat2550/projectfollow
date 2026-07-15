"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import IllegalTable, {
	SortField as IllegalSortField,
} from "@/components/immigrants/IllegalTable";
import RepatriatedTable, {
	SortField as RepatriatedSortField,
} from "@/components/immigrants/RepatriatedTable";
// เปลี่ยนจาก DonutChart เป็น BarChart (ต้องสร้างไฟล์ BarChart ไว้ในตำแหน่งเดียวกัน)
import BarChart from "@/components/dashboard/BarChart";
import LineChart from "@/components/dashboard/LineChart";
import { useDashboard } from "@/hooks/useDashboard";

function DashboardContent() {
	const { states, actions, derived } = useDashboard();
	const inputClass =
		"w-full bg-background border border-[var(--wrapper)] text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--header)]/40 dark:[color-scheme:dark]";

	const [showSettings, setShowSettings] = useState(false);
	const [visibleCharts, setVisibleCharts] = useState<string[]>([]);

	useEffect(() => {
		const getCookie = (name: string): string | null => {
			const value = `; ${document.cookie}`;
			const parts = value.split(`; ${name}=`);
			if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
			return null;
		};

		const cookieVal = getCookie("dashboard_visible_charts");
		if (cookieVal) {
			setVisibleCharts(cookieVal.split(",").filter(Boolean));
		} else {
			setVisibleCharts([
				"nationality",
				"region",
				"province",
				"gender",
				"victim",
				"passport",
				"creator",
				"ageGroup",
				"dateTrend",
			]);
		}
	}, []);

	const saveVisibleCharts = (chartsList: string[]) => {
		setVisibleCharts(chartsList);
		const date = new Date();
		date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000);
		document.cookie = `dashboard_visible_charts=${chartsList.join(",")}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
	};

	const toggleChart = (key: string) => {
		const isVisible = visibleCharts.includes(key);
		const updated =
			isVisible ?
				visibleCharts.filter((k) => k !== key)
			:	[...visibleCharts, key];
		saveVisibleCharts(updated);
	};

	return (
		<div
			className="w-full p-4 transition-colors duration-200 sm:p-6"
			style={{
				backgroundColor: "var(--wrapper)",
				minHeight: "calc(100vh - 80px)",
			}}
		>
			<Link
				href="/"
				className="mb-6 inline-flex items-center gap-1 text-2xl font-bold text-(--header) transition hover:opacity-70"
			>
				{"< แดชบอร์ด"}
			</Link>

			<div className="flex w-full flex-col items-start gap-6 lg:flex-row">
				{/* แผงควบคุม Filters */}
				<div className="flex w-full shrink-0 flex-col gap-5 rounded-[0.2rem] border border-(--wrapper) bg-(--container) p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.25)] lg:w-72">
					<span className="text-lg font-bold text-(--header)">
						ฟิลเตอร์ตัวเลือก
					</span>
					<div className="flex flex-col gap-2">
						<label className="text- (--header)] text-sm font-bold opacity-70">
							ประเภทข้อมูล
						</label>
						<select
							value={states.filterType}
							onChange={(e) =>
								actions.handleTypeChange(
									e.target.value as "illegal" | "repatriated"
								)
							}
							className={inputClass}
						>
							<option value="illegal">ผู้ลักลอบเข้า (Illegal)</option>
							<option value="repatriated">ผู้ถูกส่งกลับ (Repatriated)</option>
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text- (--header)] text-sm font-bold opacity-70">
							สัญชาติ
						</label>
						<select
							value={states.filterNat}
							onChange={(e) =>
								actions.handleFilterChange(actions.setFilterNat, e.target.value)
							}
							className={inputClass}
						>
							{derived.nationalitiesOptions.map((n) => (
								<option key={n} value={n}>
									{n}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text- (--header)] text-sm font-bold opacity-70">
							เพศ
						</label>
						<select
							value={states.filterGender}
							onChange={(e) =>
								actions.handleFilterChange(
									actions.setFilterGender,
									e.target.value
								)
							}
							className={inputClass}
						>
							{derived.gendersOptions.map((g) => (
								<option key={g} value={g}>
									{g}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text- (--header)] text-sm font-bold opacity-70">
							ภาคที่พบ/ส่งกลับ
						</label>
						<select
							value={states.filterRegion}
							onChange={(e) =>
								actions.handleFilterChange(
									actions.setFilterRegion,
									e.target.value
								)
							}
							className={inputClass}
						>
							{derived.regionsOptions.map((r) => (
								<option key={r} value={r}>
									{r}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text- (--header)] text-sm font-bold opacity-70">
							จังหวัดที่พบ/ส่งกลับ
						</label>
						<select
							value={states.filterProvince}
							onChange={(e) =>
								actions.handleFilterChange(
									actions.setFilterProvince,
									e.target.value
								)
							}
							className={inputClass}
						>
							{derived.provincesOptions.map((p) => (
								<option key={p} value={p}>
									{p}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text-sm font-bold text-stone-600 dark:text-slate-300">
							ผู้เพิ่มข้อมูล
						</label>
						<select
							value={states.filterCreator}
							onChange={(e) =>
								actions.handleFilterChange(
									actions.setFilterCreator,
									e.target.value
								)
							}
							className={inputClass}
						>
							{derived.creatorsOptions.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-col gap-2">
						<label className="text- (--header)] text-sm font-bold opacity-70">
							ช่วงอายุ
						</label>
						<select
							value={states.filterAge}
							onChange={(e) =>
								actions.handleFilterChange(actions.setFilterAge, e.target.value)
							}
							className={inputClass}
						>
							{derived.ageOptions.map((a) => (
								<option key={a} value={a}>
									{a}
								</option>
							))}
						</select>
					</div>

					{states.filterType === "illegal" && (
						<>
							<div className="flex flex-col gap-2">
								<label className="text- (--header)] text-sm font-bold opacity-70">
									สถานะผู้เสียหาย
								</label>
								<select
									value={states.filterVictim}
									onChange={(e) =>
										actions.handleFilterChange(
											actions.setFilterVictim,
											e.target.value
										)
									}
									className={inputClass}
								>
									<option value="ทั้งหมด">ทั้งหมด</option>
									<option value="true">เป็นผู้เสียหาย</option>
									<option value="false">ไม่เป็นผู้เสียหาย</option>
									<option value="PENDING">ไม่คัดกรองสถานะ</option>
								</select>
							</div>
							<div className="flex flex-col gap-2">
								<label className="text- (--header)] text-sm font-bold opacity-70">
									สถานะหนังสือเดินทาง
								</label>
								<select
									value={states.filterPassport}
									onChange={(e) =>
										actions.handleFilterChange(
											actions.setFilterPassport,
											e.target.value
										)
									}
									className={inputClass}
								>
									<option value="ทั้งหมด">ทั้งหมด</option>
									<option value="true">มีหนังสือเดินทาง</option>
									<option value="false">ไม่มี / ไม่มีข้อมูล</option>
								</select>
							</div>
						</>
					)}

					<div className="mt-2 flex flex-col gap-2">
						<label className="text- (--header)] text-sm font-bold opacity-70">
							{states.filterType === "repatriated" ?
								"วันที่ส่งกลับ (ตั้งแต่)"
							:	"ตั้งแต่วันที่ตรวจพบ"}
						</label>
						<input
							type="date"
							value={states.startDate}
							onChange={(e) =>
								actions.handleFilterChange(actions.setStartDate, e.target.value)
							}
							className={inputClass}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label className="text- (--header)] text-sm font-bold opacity-70">
							{states.filterType === "repatriated" ?
								"วันที่ส่งกลับ (ถึง)"
							:	"ถึงวันที่ตรวจพบ"}
						</label>
						<input
							type="date"
							value={states.endDate}
							onChange={(e) =>
								actions.handleFilterChange(actions.setEndDate, e.target.value)
							}
							className={inputClass}
						/>
					</div>

					{states.filterType === "repatriated" && (
						<>
							<div className="mt-2 flex flex-col gap-2 border-t border-(--wrapper) pt-4">
								<label className="text- (--header)] text-sm font-bold opacity-70">
									วันเกิดตั้งแต่
								</label>
								<input
									type="date"
									value={states.dobStart}
									onChange={(e) =>
										actions.handleFilterChange(
											actions.setDobStart,
											e.target.value
										)
									}
									className={inputClass}
								/>
							</div>
							<div className="flex flex-col gap-2">
								<label className="text- (--header)] text-sm font-bold opacity-70">
									ถึงวันที่ (วันเกิด)
								</label>
								<input
									type="date"
									value={states.dobEnd}
									onChange={(e) =>
										actions.handleFilterChange(
											actions.setDobEnd,
											e.target.value
										)
									}
									className={inputClass}
								/>
							</div>
						</>
					)}
					<button
						onClick={actions.resetFilters}
						className="text-foreground mt-2 w-full cursor-pointer rounded-lg bg-(--wrapper) py-2 text-sm font-bold shadow-sm transition hover:opacity-90 active:scale-[0.98]"
					>
						รีเซ็ตทั้งหมด
					</button>
				</div>

				{/* โซนแสดงผล */}
				<div className="relative flex w-full min-w-0 flex-1 flex-col gap-6">
					{states.loading && !states.dashboardData ?
						<div className="flex h-64 flex-col items-center justify-center rounded-[0.2rem] border border-(--wrapper) bg-(--container) shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
							<div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-(--wrapper) border-t-(--header)"></div>
							<span className="text-muted-foreground text-sm font-medium">
								กำลังโหลดข้อมูลแดชบอร์ดล่าสุด...
							</span>
						</div>
					:	<div
							className={`flex w-full flex-col gap-6 transition-opacity duration-300 ${states.isUpdating ? "pointer-events-none opacity-50" : "opacity-100"}`}
						>
							{/* Stats */}
							<div className="rounded-[0.2rem] border border-(--wrapper) bg-(--container) p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
								<span className="mb-4 block justify-between text-lg font-bold text-(--header)">
									<span>สถิติเบื้องต้น</span>
									{states.isUpdating && (
										<span className="ml-4 animate-pulse text-xs opacity-70">
											กำลังอัปเดต...
										</span>
									)}
								</span>
								<div className="flex flex-wrap gap-10">
									{derived.stats.map((s) => (
										<div key={s.label} className="flex flex-col">
											<span className="text- (--header)] mb-1 text-sm font-bold opacity-70">
												{s.label}
											</span>
											<span className="text-4xl font-black text-(--header)">
												{Number(s.value).toLocaleString("th-TH")}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Charts - เปลี่ยนไปใช้ BarChart หมด */}
							<div className="relative rounded-[0.2rem] border border-(--wrapper) bg-(--container) p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
								<div className="mb-6 flex items-center justify-between">
									<span className="text-lg font-bold text-(--header)">
										กราฟสรุปจำนวนคนทั้งหมด
									</span>
									<button
										onClick={() => setShowSettings(true)}
										className="flex cursor-pointer items-center gap-1 rounded border border-zinc-300 bg-(--wrapper) px-3 py-1.5 text-xs font-bold text-(--header) transition select-none hover:opacity-80 active:scale-95 dark:border-zinc-700"
									>
										⚙️ ตั้งค่าความน่าสนใจของกราฟ
									</button>
								</div>

								{(
									!states.dashboardData
									|| states.dashboardData.tableData.length === 0
								) ?
									<div className="text-muted-foreground flex h-48 items-center justify-center text-sm font-medium">
										ไม่มีข้อมูลแสดงผลตามสัญชาติหรือวันที่ระบุ
									</div>
								:	<div className="grid w-full grid-cols-1 items-start justify-start gap-8 pb-2 sm:grid-cols-2">
										{states.filterType === "illegal" ?
											<>
												{(!visibleCharts.length
													|| visibleCharts.includes("dateTrend"))
													&& derived.dateTrendChart.length > 0 && (
														<LineChart
															data={derived.dateTrendChart}
															title="แนวโน้มวันที่พบ (รายเดือน)"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("nationality"))
													&& derived.natChart.length > 0 && (
														<BarChart
															data={derived.natChart}
															title="สัญชาติ (Top 6)"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("region"))
													&& derived.regionChart.length > 0 && (
														<BarChart data={derived.regionChart} title="ภาค" />
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("province"))
													&& derived.provinceChart.length > 0 && (
														<BarChart
															data={derived.provinceChart}
															title="จังหวัด (Top 6)"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("ageGroup"))
													&& derived.ageChart.length > 0 && (
														<BarChart
															data={derived.ageChart}
															title="ช่วงอายุ"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("gender"))
													&& derived.genderChart.length > 0 && (
														<BarChart data={derived.genderChart} title="เพศ" />
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("victim"))
													&& derived.victimChart.length > 0 && (
														<BarChart
															data={derived.victimChart}
															title="สถานะผู้เสียหาย"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("passport"))
													&& derived.passportChart.length > 0 && (
														<BarChart
															data={derived.passportChart}
															title="สถานะหนังสือเดินทาง"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("creator"))
													&& derived.creatorChart.length > 0 && (
														<BarChart
															data={derived.creatorChart}
															title="ผู้เพิ่มข้อมูล"
														/>
													)}
											</>
										:	<>
												{(!visibleCharts.length
													|| visibleCharts.includes("dateTrend"))
													&& derived.dateTrendChart.length > 0 && (
														<LineChart
															data={derived.dateTrendChart}
															title="แนวโน้มวันที่ส่งกลับ (รายเดือน)"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("nationality"))
													&& derived.natChart.length > 0 && (
														<BarChart
															data={derived.natChart}
															title="สัญชาติ (Top 6)"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("region"))
													&& derived.regionChart.length > 0 && (
														<BarChart data={derived.regionChart} title="ภาค" />
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("province"))
													&& derived.provinceChart.length > 0 && (
														<BarChart
															data={derived.provinceChart}
															title="จังหวัด (Top 6)"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("ageGroup"))
													&& derived.ageChart.length > 0 && (
														<BarChart
															data={derived.ageChart}
															title="ช่วงอายุ"
														/>
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("gender"))
													&& derived.genderChart.length > 0 && (
														<BarChart data={derived.genderChart} title="เพศ" />
													)}
												{(!visibleCharts.length
													|| visibleCharts.includes("victim"))
													&& derived.victimChart.length > 0 && (
														<BarChart
															data={derived.victimChart}
															title="สถานะผู้เสียหาย"
														/>
													)}

												{(!visibleCharts.length
													|| visibleCharts.includes("creator"))
													&& derived.creatorChart.length > 0 && (
														<BarChart
															data={derived.creatorChart}
															title="ผู้เพิ่มข้อมูล"
														/>
													)}
											</>
										}
									</div>
								}
							</div>

							{/* Popup Modal สำหรับ Checkboxes ตั้งค่า */}
							{showSettings && (
								<div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
									<div className="relative w-full max-w-md rounded-[0.2rem] border border-(--wrapper) bg-(--container) p-6 shadow-2xl">
										<h4 className="mb-4 text-lg font-bold text-(--header)">
											⚙️ ตั้งค่าความน่าสนใจของกราฟ
										</h4>
										<p className="mb-4 text-sm text-(--header) opacity-80">
											เลือกกราฟที่ต้องการให้แสดงผลบนแดชบอร์ดหลัก:
										</p>

										<div className="mb-6 flex flex-col gap-3">
											{states.filterType === "illegal" ?
												<>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("dateTrend")}
															onChange={() => toggleChart("dateTrend")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														แนวโน้มวันที่ (รายเดือน)
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("nationality")}
															onChange={() => toggleChart("nationality")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														สัญชาติ (Top 6)
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("region")}
															onChange={() => toggleChart("region")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														ภาค
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("province")}
															onChange={() => toggleChart("province")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														จังหวัด (Top 6)
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("ageGroup")}
															onChange={() => toggleChart("ageGroup")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														ช่วงอายุ
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("gender")}
															onChange={() => toggleChart("gender")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														เพศ
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("victim")}
															onChange={() => toggleChart("victim")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														สถานะผู้เสียหาย
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("passport")}
															onChange={() => toggleChart("passport")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														สถานะหนังสือเดินทาง
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
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
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("dateTrend")}
															onChange={() => toggleChart("dateTrend")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														แนวโน้มวันที่ (รายเดือน)
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("nationality")}
															onChange={() => toggleChart("nationality")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														สัญชาติ (Top 6)
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("region")}
															onChange={() => toggleChart("region")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														ภาค
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("province")}
															onChange={() => toggleChart("province")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														จังหวัด (Top 6)
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("ageGroup")}
															onChange={() => toggleChart("ageGroup")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														ช่วงอายุ
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
														<input
															type="checkbox"
															checked={visibleCharts.includes("gender")}
															onChange={() => toggleChart("gender")}
															className="h-4 w-4 accent-(--blueText)"
														/>
														เพศ
													</label>
													<label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-(--header) select-none">
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
												className="cursor-pointer rounded bg-zinc-200 px-3.5 py-1.5 text-sm font-bold text-(--header) transition select-none hover:opacity-80 dark:bg-zinc-800"
											>
												แสดงผลทั้งหมด
											</button>
											<button
												onClick={() => setShowSettings(false)}
												className="cursor-pointer rounded bg-(--blueText) px-5 py-1.5 text-sm font-bold text-(--button) transition select-none hover:opacity-90"
											>
												ตกลง
											</button>
										</div>
									</div>
								</div>
							)}

							{/* Table & Pagination */}
							<div className="mb-10 bg-transparent">
								<div className="mb-6 flex items-center justify-between">
									<span className="text-lg font-bold text-(--header)">
										ตารางข้อมูล ({derived.totalItems.toLocaleString("th-TH")}{" "}
										รายการ)
									</span>
								</div>
								<div className="overflow-hidden rounded-[0.2rem] border border-(--wrapper) bg-(--container) shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
									{states.filterType === "illegal" ?
										<IllegalTable
											data={derived.tableRows}
											sortField={states.sortField as IllegalSortField}
											sortDirection={states.sortDirection}
											onSort={actions.handleSort}
										/>
									:	<RepatriatedTable
											data={derived.tableRows}
											sortField={states.sortField as RepatriatedSortField}
											sortDirection={states.sortDirection}
											onSort={actions.handleSort}
										/>
									}
								</div>
								{/* แถบควบคุมเปลี่ยนหน้าเพจ (Pagination) ฉบับเต็ม */}
								{derived.totalPages > 1
									&& (() => {
										const totalPages = derived.totalPages;

										let startPage = Math.max(1, states.currentPage - 5);
										let endPage = Math.min(totalPages, states.currentPage + 5);

										if (endPage - startPage < 10) {
											if (startPage === 1) {
												endPage = Math.min(totalPages, startPage + 10);
											} else if (endPage === totalPages) {
												startPage = Math.max(1, endPage - 10);
											}
										}

										const pageNumbers = [];
										for (let i = startPage; i <= endPage; i++) {
											pageNumbers.push(i);
										}

										return (
											<div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[0.2rem] border border-(--wrapper) bg-(--container) p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.25)] md:flex-row">
												<span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
													หน้า {states.currentPage} จาก {totalPages}
												</span>

												<div className="flex items-center gap-1 sm:gap-2">
													<button
														disabled={states.currentPage === 1}
														onClick={() => actions.setCurrentPage(1)}
														className="cursor-pointer rounded-sm border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
														title="หน้าแรกสุด"
													>
														&laquo;
													</button>

													<button
														disabled={states.currentPage === 1}
														onClick={() =>
															actions.setCurrentPage(
																Math.max(states.currentPage - 1, 1)
															)
														}
														className="cursor-pointer rounded-sm border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
														title="ก่อนหน้า"
													>
														&lsaquo;
													</button>

													<div className="hidden items-center gap-1 sm:flex">
														{pageNumbers.map((page) => (
															<button
																key={page}
																onClick={() => actions.setCurrentPage(page)}
																className={`cursor-pointer rounded-sm border px-3 py-2 text-sm font-medium transition ${
																	page === states.currentPage ?
																		"pointer-events-none border-zinc-800 bg-zinc-800 text-white dark:border-zinc-200 dark:bg-zinc-200 dark:text-zinc-900"
																	:	"border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
																}`}
															>
																{page}
															</button>
														))}
													</div>

													<button
														disabled={states.currentPage === totalPages}
														onClick={() =>
															actions.setCurrentPage(
																Math.min(states.currentPage + 1, totalPages)
															)
														}
														className="cursor-pointer rounded-sm border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
														title="ถัดไป"
													>
														&rsaquo;
													</button>

													<button
														disabled={states.currentPage === totalPages}
														onClick={() => actions.setCurrentPage(totalPages)}
														className="cursor-pointer rounded-sm border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
														title="หน้าท้ายสุด"
													>
														&raquo;
													</button>
												</div>
											</div>
										);
									})()}
							</div>
						</div>
					}
				</div>
			</div>
		</div>
	);
}

export default function Dashboard() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					กำลังโหลดระบบแดชบอร์ด...
				</div>
			}
		>
			<DashboardContent />
		</Suspense>
	);
}
