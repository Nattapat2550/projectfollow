"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import IllegalTable, { SortField as IllegalSortField } from "@/app/immigrants/illegal/table";
import RepatriatedTable, {
	SortField as RepatriatedSortField,
} from "@/app/immigrants/repatriated/table";
import BarChart from "@/components/dashboard/BarChart";
import LineChart from "@/components/dashboard/LineChart";
import TablePagination from "@/components/table/table-pagination";
import { useDashboard } from "@/hooks/useDashboard";

import DashboardPageFilterPanel from "./filter-panel";
import DashboardPageDialog from "./visible-chart-dialog";

function DashboardContent() {
	const details = useDashboard();
	const { states, actions, derived } = details;

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
				className="text-header mb-6 inline-flex items-center gap-1 text-2xl font-bold transition hover:opacity-70"
			>
				{"< แดชบอร์ด"}
			</Link>

			<div className="flex w-full flex-col items-start gap-6 lg:flex-row">
				{/* แผงควบคุม Filters */}
				<DashboardPageFilterPanel detail={details} />

				{/* โซนแสดงผล */}
				<div className="relative flex w-full min-w-0 flex-1 flex-col gap-6">
					{states.loading && !states.dashboardData ?
						<div className="flex h-64 flex-col items-center justify-center rounded-md border border-(--wrapper) bg-(--container) shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
							<div className="border-t-header mb-4 h-10 w-10 animate-spin rounded-full border-4 border-(--wrapper)"></div>
							<span className="text-muted-foreground text-sm font-medium">
								กำลังโหลดข้อมูลแดชบอร์ดล่าสุด...
							</span>
						</div>
					:	<div
							className={`flex w-full flex-col gap-6 transition-opacity duration-300 ${states.isUpdating ? "pointer-events-none opacity-50" : "opacity-100"}`}
						>
							{/* Stats */}
							<div className="rounded-md border border-(--wrapper) bg-(--container) p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
								<span className="text-header mb-4 block justify-between text-lg font-bold">
									<span>สถิติเบื้องต้น</span>
									{states.isUpdating && (
										<span className="ml-4 animate-pulse text-xs opacity-70">กำลังอัปเดต...</span>
									)}
								</span>
								<div className="flex flex-wrap gap-10">
									{derived.stats.map((s) => (
										<div key={s.label} className="flex flex-col">
											<span className="text- (--header)] mb-1 text-sm font-bold opacity-70">
												{s.label}
											</span>
											<span className="text-header text-4xl font-black">
												{Number(s.value).toLocaleString("th-TH")}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Charts - เปลี่ยนไปใช้ BarChart หมด */}
							<div className="relative rounded-md border border-(--wrapper) bg-(--container) p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
								<div className="mb-6 flex items-center justify-between">
									<span className="text-header text-lg font-bold">กราฟสรุปจำนวนคนทั้งหมด</span>
									<button
										onClick={() => setShowSettings(true)}
										className="text-header flex cursor-pointer items-center gap-1 rounded border border-zinc-300 bg-(--wrapper) px-3 py-1.5 text-xs font-bold transition select-none hover:opacity-80 active:scale-95 dark:border-zinc-700"
									>
										⚙️ ตั้งค่าความน่าสนใจของกราฟ
									</button>
								</div>

								{!states.dashboardData || states.dashboardData.tableData.length === 0 ?
									<div className="text-muted-foreground flex h-48 items-center justify-center text-sm font-medium">
										ไม่มีข้อมูลแสดงผลตามสัญชาติหรือวันที่ระบุ
									</div>
								:	<div className="grid w-full grid-cols-1 items-start justify-start gap-8 pb-2 sm:grid-cols-2">
										{states.filterType === "illegal" ?
											<>
												{(!visibleCharts.length || visibleCharts.includes("dateTrend"))
													&& derived.dateTrendChart.length > 0 && (
														<LineChart
															data={derived.dateTrendChart}
															title="แนวโน้มวันที่พบ (รายเดือน)"
														/>
													)}
												{(!visibleCharts.length || visibleCharts.includes("nationality"))
													&& derived.natChart.length > 0 && (
														<BarChart data={derived.natChart} title="สัญชาติ (Top 6)" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("region"))
													&& derived.regionChart.length > 0 && (
														<BarChart data={derived.regionChart} title="ภาค" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("province"))
													&& derived.provinceChart.length > 0 && (
														<BarChart data={derived.provinceChart} title="จังหวัด (Top 6)" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("ageGroup"))
													&& derived.ageChart.length > 0 && (
														<BarChart data={derived.ageChart} title="ช่วงอายุ" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("gender"))
													&& derived.genderChart.length > 0 && (
														<BarChart data={derived.genderChart} title="เพศ" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("victim"))
													&& derived.victimChart.length > 0 && (
														<BarChart data={derived.victimChart} title="สถานะผู้เสียหาย" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("passport"))
													&& derived.passportChart.length > 0 && (
														<BarChart data={derived.passportChart} title="สถานะหนังสือเดินทาง" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("creator"))
													&& derived.creatorChart.length > 0 && (
														<BarChart data={derived.creatorChart} title="ผู้เพิ่มข้อมูล" />
													)}
											</>
										:	<>
												{(!visibleCharts.length || visibleCharts.includes("dateTrend"))
													&& derived.dateTrendChart.length > 0 && (
														<LineChart
															data={derived.dateTrendChart}
															title="แนวโน้มวันที่ส่งกลับ (รายเดือน)"
														/>
													)}
												{(!visibleCharts.length || visibleCharts.includes("nationality"))
													&& derived.natChart.length > 0 && (
														<BarChart data={derived.natChart} title="สัญชาติ (Top 6)" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("region"))
													&& derived.regionChart.length > 0 && (
														<BarChart data={derived.regionChart} title="ภาค" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("province"))
													&& derived.provinceChart.length > 0 && (
														<BarChart data={derived.provinceChart} title="จังหวัด (Top 6)" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("ageGroup"))
													&& derived.ageChart.length > 0 && (
														<BarChart data={derived.ageChart} title="ช่วงอายุ" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("gender"))
													&& derived.genderChart.length > 0 && (
														<BarChart data={derived.genderChart} title="เพศ" />
													)}
												{(!visibleCharts.length || visibleCharts.includes("victim"))
													&& derived.victimChart.length > 0 && (
														<BarChart data={derived.victimChart} title="สถานะผู้เสียหาย" />
													)}

												{(!visibleCharts.length || visibleCharts.includes("creator"))
													&& derived.creatorChart.length > 0 && (
														<BarChart data={derived.creatorChart} title="ผู้เพิ่มข้อมูล" />
													)}
											</>
										}
									</div>
								}
							</div>

							{/* Popup Modal สำหรับ Checkboxes ตั้งค่า */}
							<DashboardPageDialog
								type={states.filterType}
								open={showSettings}
								setOpen={setShowSettings}
								visibleCharts={visibleCharts}
								setVisibleCharts={setVisibleCharts}
							/>

							{/* Table & Pagination */}
							<div className="mb-10 bg-transparent">
								<div className="mb-6 flex items-center justify-between">
									<span className="text-header text-lg font-bold">
										ตารางข้อมูล ({derived.totalItems.toLocaleString("th-TH")} รายการ)
									</span>
								</div>
								<div className="overflow-hidden rounded-md border border-(--wrapper) bg-(--container) shadow-[4px_4px_0px_rgba(0,0,0,0.25)]">
									{states.filterType === "illegal" ?
										<IllegalTable
											totalItems={derived.totalItems}
											data={derived.tableRows}
											sortField={states.sortField as IllegalSortField}
											sortDirection={states.sortDirection}
											onSort={actions.handleSort}
											isUpdating={states.isUpdating}
										/>
									:	<RepatriatedTable
											totalItems={derived.totalItems}
											data={derived.tableRows}
											sortField={states.sortField as RepatriatedSortField}
											sortDirection={states.sortDirection}
											onSort={actions.handleSort}
											isUpdating={states.isUpdating}
										/>
									}
								</div>
								<TablePagination
									currentPage={states.currentPage}
									totalPages={derived.totalPages}
									handlePageChange={actions.setCurrentPage}
								/>
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
