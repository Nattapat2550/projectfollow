"use client";

import NativeSelectField from "@/components/form/field/native-select";
import { useDashboard } from "@/hooks/useDashboard";

const inputClass =
	"w-full bg-background border border-[var(--wrapper)] text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--header)]/40 dark:[color-scheme:dark]";

export default function DashboardPageFilterPanel({
	detail,
}: {
	detail: ReturnType<typeof useDashboard>;
}) {
	const { states, actions, derived } = detail;

	return (
		<div className="flex w-full shrink-0 flex-col gap-5 rounded-md border border-(--wrapper) bg-(--container) p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.25)] lg:w-72">
			<span className="text-header text-lg font-bold">ฟิลเตอร์ตัวเลือก</span>

			<NativeSelectField
				label="ประเภทข้อมูล"
				value={states.filterType}
				onChange={(e) => actions.handleTypeChange(e.target.value as "illegal" | "repatriated")}
				options={[
					{ value: "illegal", label: "ผู้ลักลอบเข้า (Illegal)" },
					{ value: "repatriated", label: "ผู้ถูกส่งกลับ (Repatriated)" },
				]}
			/>

			<NativeSelectField
				label="สัญชาติ"
				value={states.filterNat}
				onChange={(e) => actions.handleFilterChange(actions.setFilterNat, e.target.value)}
				options={derived.nationalitiesOptions.map((option) => ({
					value: option,
					label: option,
				}))}
			/>

			<NativeSelectField
				label="เพศ"
				value={states.filterGender}
				onChange={(e) => actions.handleFilterChange(actions.setFilterGender, e.target.value)}
				options={derived.gendersOptions.map((option) => ({
					value: option,
					label: option,
				}))}
			/>

			<NativeSelectField
				label="ภาคที่พบ/ส่งกลับ"
				value={states.filterRegion}
				onChange={(e) => actions.handleFilterChange(actions.setFilterRegion, e.target.value)}
				options={derived.regionsOptions.map((option) => ({
					value: option,
					label: option,
				}))}
			/>

			<NativeSelectField
				label="จังหวัดที่พบ/ส่งกลับ"
				value={states.filterProvince}
				onChange={(e) => actions.handleFilterChange(actions.setFilterProvince, e.target.value)}
				options={derived.provincesOptions.map((option) => ({
					value: option,
					label: option,
				}))}
			/>

			<NativeSelectField
				label="ผู้เพิ่มข้อมูล"
				value={states.filterCreator}
				onChange={(e) => actions.handleFilterChange(actions.setFilterCreator, e.target.value)}
				options={derived.creatorsOptions.map((option) => ({
					value: option,
					label: option,
				}))}
			/>

			<NativeSelectField
				label="ช่วงอายุ"
				value={states.filterAge}
				onChange={(e) => actions.handleFilterChange(actions.setFilterAge, e.target.value)}
				options={derived.ageOptions.map((option) => ({
					value: option,
					label: option,
				}))}
			/>

			{states.filterType === "illegal" && (
				<>
					<div className="flex flex-col gap-2">
						<label className="text- (--header)] text-sm font-bold opacity-70">
							สถานะผู้เสียหาย
						</label>
						<select
							value={states.filterVictim}
							onChange={(e) => actions.handleFilterChange(actions.setFilterVictim, e.target.value)}
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
								actions.handleFilterChange(actions.setFilterPassport, e.target.value)
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
					{states.filterType === "repatriated" ? "วันที่ส่งกลับ (ตั้งแต่)" : "ตั้งแต่วันที่ตรวจพบ"}
				</label>
				<input
					type="date"
					value={states.startDate}
					onChange={(e) => actions.handleFilterChange(actions.setStartDate, e.target.value)}
					className={inputClass}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<label className="text- (--header)] text-sm font-bold opacity-70">
					{states.filterType === "repatriated" ? "วันที่ส่งกลับ (ถึง)" : "ถึงวันที่ตรวจพบ"}
				</label>
				<input
					type="date"
					value={states.endDate}
					onChange={(e) => actions.handleFilterChange(actions.setEndDate, e.target.value)}
					className={inputClass}
				/>
			</div>

			{states.filterType === "repatriated" && (
				<>
					<div className="mt-2 flex flex-col gap-2 border-t border-(--wrapper) pt-4">
						<label className="text- (--header)] text-sm font-bold opacity-70">วันเกิดตั้งแต่</label>
						<input
							type="date"
							value={states.dobStart}
							onChange={(e) => actions.handleFilterChange(actions.setDobStart, e.target.value)}
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
							onChange={(e) => actions.handleFilterChange(actions.setDobEnd, e.target.value)}
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
	);
}
