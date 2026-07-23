"use client";

import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";

import IllegalTable, { SortField } from "@/app/immigrants/illegal/table";
import UniversalImmigrantCard from "@/components/immigrants/UniversalImmigrantCard";
import TablePagination from "@/components/table/table-pagination";
import { GetAllIllegalResponse } from "@/lib/schema/illegal";
import { getAllIllegal } from "@/lib/service/illegal";

import { FilterOptions } from "./filter";

const illegalTranslationMap: { [key: string]: string } = {
	id: "รหัสอ้างอิงระบบ",
	first_name_th: "ชื่อจริง (ภาษาไทย)",
	middle_name_th: "ชื่อกลาง (ภาษาไทย)",
	last_name_th: "นามสกุล (ภาษาไทย)",
	first_name_en: "ชื่อจริง (ภาษาอังกฤษ)",
	middle_name_en: "ชื่อกลาง (ภาษาอังกฤษ)",
	last_name_en: "นามสกุล (ภาษาอังกฤษ)",
	passport_id: "เลขที่หนังสือเดินทาง (Passport ID)",
	gender: "เพศ",
	nationality: "สัญชาติ",
	date_of_birth: "วันเกิด",
	detected_date: "วันที่ตรวจพบ",
	detected_location_details: "รายละเอียดสถานที่ตรวจพบ",
	detected_location_sub_district: "ตำบลที่ตรวจพบ",
	detected_location_district: "อำเภอที่ตรวจพบ",
	detected_location_province: "จังหวัดที่ตรวจพบ",
	workplace: "สถานที่ทำงาน/จุดตรวจพบ",
	screening_details: "รายละเอียดคัดกรอง",
	is_victim: "สถานะการคัดแยกผู้เสียหาย",
	note: "หมายเหตุ",
	photo_url: "ลิงก์รูปถ่ายโปรไฟล์",
	passport_photo_url: "ลิงก์รูปถ่ายหนังสือเดินทาง",
	created_by: "รหัสผู้บันทึกข้อมูล",
	created_at: "วันเวลาที่สร้างข้อมูล",
	updated_at: "วันเวลาที่แก้ไขล่าสุด",
	creator_name: "ชื่อผู้บันทึกข้อมูล",
	creator_color: "โค้ดสีของผู้บันทึก",
};

const formatValue = (key: string, val: IllegalData[keyof IllegalData]) => {
	if (val === null || val === undefined) return "-";
	if (key.includes("date") && typeof val === "string" && !isNaN(Date.parse(val))) {
		return new Date(val).toLocaleDateString("th-TH");
	}
	return val;
};

function IllegalPageContent() {
	const [data, setData] = useState<GetAllIllegalResponse | null>(null);

	const [filter, setFilter] = useState<FilterOptions>({});
	const [loading, setLoading] = useState(true);
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [currentPage, setCurrentPage] = useState(1);

	const [sortField, setSortField] = useState<SortField | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");

	const [isExportMode, setIsExportMode] = useState(false);
	const [selectedRows, setSelectedRows] = useState<IllegalData[]>([]);
	const [isExporting, setIsExporting] = useState(false);

	const selectedIds = selectedRows.map((r) => r.id);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchTerm);
			setCurrentPage(1);
		}, 500);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	useEffect(() => {
		const fetchData = async () => {
			setError(null);
			if (!data) setLoading(true);
			else setIsUpdating(true);

			const response = await getAllIllegal({
				page: currentPage.toString(),
				limit: "50",
				sortBy: sortField ?? undefined,
				sortOrder: sortDirection,
				search: debouncedSearch.trim(),
				...filter,
			});

			if (response.success) {
				setData(response);
			} else {
				console.error("Fetch Error:", response.message);
				setError(response.message);
			}
			setLoading(false);
			setIsUpdating(false);
		};

		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage, sortField, sortDirection, debouncedSearch, filter]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortField(field);
			setSortDirection("asc");
		}
		setCurrentPage(1);
	};

	const handlePageChange = (newPage: number) => {
		setCurrentPage(newPage);
	};

	const handleCancelExport = () => {
		setIsExportMode(false);
		setSelectedRows([]);
	};

	const handleToggleSelect = (id: string) => {
		const isSelected = selectedRows.some((r) => r.id === id);
		if (isSelected) {
			setSelectedRows((prev) => prev.filter((r) => r.id !== id));
		} else {
			const person = tableRows.find((r) => r.id === id);
			if (person) setSelectedRows((prev) => [...prev, person]);
		}
	};

	const handleSelectAll = (selectAll: boolean) => {
		if (selectAll) {
			const newRows = [...selectedRows];
			tableRows.forEach((r) => {
				if (!newRows.some((nr) => nr.id === r.id)) newRows.push(r);
			});
			setSelectedRows(newRows);
		} else {
			const currentViewIds = tableRows.map((r) => r.id);
			setSelectedRows((prev) => prev.filter((r) => !currentViewIds.includes(r.id)));
		}
	};

	const handleExportConfirm = async () => {
		if (selectedRows.length === 0) {
			Swal.fire({
				title: "เกิดข้อผิดพลาด",
				text: "กรุณาเลือกข้อมูลอย่างน้อย 1 รายการ",
				icon: "warning",
			});
			return;
		}

		const result = await Swal.fire({
			title: "เลือกรูปแบบการ Export",
			text: `คุณได้เลือกข้อมูล ${selectedRows.length} รายการ`,
			icon: "question",
			showCancelButton: true,
			showDenyButton: true,
			confirmButtonText: "Excel",
			denyButtonText: "PDF",
			cancelButtonText: "ยกเลิก",
		});

		if (result.isConfirmed) {
			// Excel
			Swal.fire({
				title: "กำลังสร้าง Excel",
				text: "กรุณารอสักครู่...",
				allowOutsideClick: false,
				didOpen: () => Swal.showLoading(),
			});
			setTimeout(() => {
				try {
					const selectedData = selectedRows.map((person) => {
						const row: Record<string, string> = {};
						const formattedKeys = [
							"first_name_th",
							"middle_name_th",
							"last_name_th",
							"first_name_en",
							"middle_name_en",
							"last_name_en",
							"detected_date",
							"is_victim",
							"id",
						];

						const fullNameTh =
							`${person.first_name_th || ""} ${person.middle_name_th || ""} ${person.last_name_th || ""}`
								.replace(/\s+/g, " ")
								.trim();
						const fullNameEn =
							`${person.first_name_en || ""} ${person.middle_name_en || ""} ${person.last_name_en || ""}`
								.replace(/\s+/g, " ")
								.trim();
						const finalName = fullNameTh || fullNameEn || "ไม่ระบุชื่อ";

						row["ชื่อ - นามสกุล"] = finalName;
						row["วันที่ตรวจพบ"] =
							person.detected_date ?
								new Date(person.detected_date).toLocaleDateString("th-TH")
							:	"-";
						row["สถานะผู้เสียหาย"] =
							person.is_victim === "YES" ? "เป็นผู้เสียหาย"
							: person.is_victim === "NO" ? "ไม่เป็นผู้เสียหาย"
							: "ไม่คัดกรองสถานะ";

						Object.keys(person).forEach((key) => {
							if (!formattedKeys.includes(key)) {
								const thaiKey = illegalTranslationMap[key] || key;
								row[thaiKey] = formatValue(key, person[key as keyof IllegalData]);
							}
						});
						return row;
					});
					const ws = XLSX.utils.json_to_sheet(selectedData);
					const wb = XLSX.utils.book_new();
					XLSX.utils.book_append_sheet(wb, ws, "Illegal Immigrants");
					XLSX.writeFile(wb, "illegal_immigrants.xlsx");
				} catch (err) {
					console.error("Excel Export error:", err);
					Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถสร้างไฟล์ Excel ได้", "error");
				} finally {
					handleCancelExport();
					Swal.close();
				}
			}, 50);
		} else if (result.isDenied) {
			// PDF
			setIsExporting(true);
			Swal.fire({
				title: "กำลังสร้าง PDF",
				html: `กรุณารอสักครู่...<br><br><div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden mt-2"><div id="swal-progress" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div></div><div id="swal-progress-text" class="mt-2 text-sm font-medium">0% (0/${selectedRows.length})</div>`,
				allowOutsideClick: false,
				didOpen: () => Swal.showLoading(),
			});
			try {
				let pdf: jsPDF | null = null;
				for (let i = 0; i < selectedRows.length; i++) {
					const id = selectedRows[i].id;
					const element = document.getElementById(`pdf-card-${id}`);
					if (element) {
						// Use html-to-image to perfectly preserve Thai typography (vowels/tones) and CSS layout
						const imgData = await toJpeg(element, {
							quality: 0.85,
							pixelRatio: 2,
							cacheBust: true,
						});

						const width = element.offsetWidth * 2;
						const height = element.offsetHeight * 2;

						if (!pdf) {
							pdf = new jsPDF("l", "px", [width, height]);
						} else {
							pdf.addPage([width, height], "l");
						}
						pdf.addImage(imgData, "JPEG", 0, 0, width, height, undefined, "FAST");

						// Update progress bar
						const percent = Math.round(((i + 1) / selectedRows.length) * 100);
						const progressBar = document.getElementById("swal-progress");
						const progressText = document.getElementById("swal-progress-text");
						if (progressBar) progressBar.style.width = `${percent}%`;
						if (progressText)
							progressText.innerText = `${percent}% (${i + 1}/${selectedRows.length})`;
					}
				}
				if (pdf) pdf.save("illegal_immigrants.pdf");
			} catch (err) {
				console.error("PDF Export error:", err);
				Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถสร้างไฟล์ PDF ได้", "error");
			} finally {
				setIsExporting(false);
				handleCancelExport();
				Swal.close();
			}
		}
	};

	const tableRows = (data?.tableData || []).map((item) => {
		const firstName =
			!item.first_name_th || item.first_name_th.trim() === "" || item.first_name_th === "ไม่ระบุ" ?
				item.first_name_en || "ไม่ระบุ"
			:	item.first_name_th;

		const lastName =
			!item.last_name_th || item.last_name_th.trim() === "" || item.last_name_th === "ไม่ระบุ" ?
				item.last_name_en || "ไม่ระบุ"
			:	item.last_name_th;

		return {
			...item,
			first_name_th: firstName,
			last_name_th: lastName,
		};
	});

	const totalItems = data?.meta?.totalItems || 0;
	const totalPages = data?.meta?.totalPages || 1;

	return (
		<div
			className="text-foreground w-full p-4 sm:p-6"
			style={{
				backgroundColor: "var(--wrapper)",
				minHeight: "calc(100vh - 80px)",
			}}
		>
			<div
				className="w-full"
				style={{
					backgroundColor: "var(--wrapper)",
					borderRadius: "0.2rem",
					boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.25)",
					overflow: "hidden",
				}}
			>
				<div
					className="p-5 sm:p-6"
					style={{
						backgroundColor: "var(--container)",
						minHeight: "calc(100vh - 120px)",
					}}
				>
					<div className="mb-6 flex items-center justify-between">
						<h1 className="text-header text-2xl font-bold">ข้อมูลผู้ลักลอบเข้าเมือง (Illegal)</h1>
						<div className="flex gap-2">
							{isExportMode ?
								<>
									<button
										onClick={handleCancelExport}
										className="text-foreground cursor-pointer rounded-sm bg-zinc-200 px-4 py-2 text-sm font-bold transition hover:opacity-90 dark:bg-zinc-800"
									>
										ยกเลิก
									</button>
									<button
										onClick={handleExportConfirm}
										disabled={isExporting}
										className="cursor-pointer rounded-sm bg-(--blueText) px-4 py-2 text-sm font-bold text-(--button) transition hover:opacity-90 disabled:opacity-50"
									>
										{isExporting ? "กำลัง Export..." : `ยืนยัน (${selectedRows.length})`}
									</button>
								</>
							:	<>
									<button
										onClick={() => {
											setIsExportMode(true);
										}}
										className="cursor-pointer rounded-sm bg-zinc-800 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 dark:bg-zinc-200 dark:text-zinc-900"
									>
										Export
									</button>
									<Link
										href="/immigrants/illegal/create"
										className="text-background bg-header rounded-sm px-4 py-2 text-sm font-bold transition hover:opacity-90"
									>
										+ เพิ่มข้อมูล
									</Link>
								</>
							}
						</div>
					</div>

					<div className="text-foreground focus-within:ring-header mb-6 flex items-center rounded-sm border border-(--wrapper) bg-(--container) px-4 py-2 shadow-[0_1px_2px_var(--shadow)] transition-all focus-within:ring-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="mr-2 h-5 w-5 shrink-0 opacity-70"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<input
							type="text"
							placeholder="ค้นหาชื่อ, สัญชาติ, สถานที่... (ใช้ช่องว่างแยกคำ เช่น 'สมชาย พม่า')"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="text-foreground w-full border-none bg-transparent text-base outline-none placeholder:text-sm placeholder:text-zinc-400"
						/>
						{searchTerm && (
							<button
								onClick={() => setSearchTerm("")}
								className="ml-2 text-zinc-400 transition hover:opacity-70"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						)}
					</div>

					{error && (
						<div className="mb-6 rounded-sm border border-red-200 bg-red-50 p-4 text-red-600">
							เกิดข้อผิดพลาด: {error}
						</div>
					)}

					{loading && !data ?
						<div className="flex h-64 flex-col items-center justify-center">
							<div className="border-t-header mb-4 h-10 w-10 animate-spin rounded-full border-4 border-(--wrapper)"></div>
							<span className="text-muted-foreground text-sm font-medium">กำลังโหลดข้อมูล...</span>
						</div>
					:	<div
							className={`mb-10 bg-transparent transition-opacity duration-300 ${isUpdating ? "pointer-events-none opacity-50" : "opacity-100"}`}
						>
							<IllegalTable
								filter={filter}
								setFilter={setFilter}
								totalItems={totalItems}
								data={tableRows}
								sortField={sortField}
								sortDirection={sortDirection}
								onSort={handleSort}
								isExportMode={isExportMode}
								selectedIds={selectedIds}
								onToggleSelect={handleToggleSelect}
								onSelectAll={handleSelectAll}
								isUpdating={isUpdating}
							/>

							<TablePagination
								currentPage={currentPage}
								totalPages={totalPages}
								handlePageChange={handlePageChange}
							/>
						</div>
					}
				</div>
			</div>

			{/* Hidden container for PDF rendering */}
			{isExportMode && selectedRows.length > 0 && (
				<div
					style={{
						position: "absolute",
						left: "-9999px",
						top: 0,
						fontFamily: "'Sarabun', sans-serif",
					}}
				>
					{selectedRows.map((person) => (
						<div
							key={person.id}
							id={`pdf-card-${person.id}`}
							style={{
								width: "856px",
								minHeight: "540px",
								height: "max-content",
								backgroundColor: "white",
							}}
						>
							<UniversalImmigrantCard data={person} type="illegal" />
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default function IllegalPage() {
	return (
		<Suspense
			fallback={
				<div className="text-muted-foreground flex h-64 items-center justify-center p-6 text-center">
					<div className="mr-3 h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-500 dark:border-zinc-800"></div>
					กำลังเริ่มระบบตารางข้อมูล...
				</div>
			}
		>
			<IllegalPageContent />
		</Suspense>
	);
}
