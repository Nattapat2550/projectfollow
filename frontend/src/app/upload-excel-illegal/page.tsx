"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export default function TestUploadPage() {
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState({ current: 0, total: 0 });
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 50;

	const formatRawExcelData = (rawData: any) => {
		if (!rawData || typeof rawData !== "object") return rawData;
		const cleaned: any = {};
		for (const key of Object.keys(rawData)) {
			const val = rawData[key];
			if (typeof val === "string" && val.startsWith("data:image/") && val.length > 100) {
				cleaned[key] = `[Base64 Image Data (${Math.round(val.length / 1024)} KB)]`;
			} else {
				cleaned[key] = val;
			}
		}
		return cleaned;
	};

	const parseFileOnClient = async (f: File) => {
		const arrayBuffer = await f.arrayBuffer();
		const workbook = XLSX.read(arrayBuffer, { type: "array" });
		const allRows: any[] = [];
		workbook.SheetNames.forEach((sheetName) => {
			const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
			if (sheetData.length > 0) {
				allRows.push(...sheetData.map((row: any) => ({ ...row, _sheetName: sheetName })));
			}
		});

		try {
			const zip = await JSZip.loadAsync(arrayBuffer);
			const drawingFiles = Object.keys(zip.files).filter((fn) =>
				fn.startsWith("xl/drawings/drawing") && fn.endsWith(".xml")
			);

			const imagesMap: { [row: number]: string } = {};

			for (const drawingFile of drawingFiles) {
				const drawingXml = await zip.files[drawingFile].async("string");
				const relsFile = drawingFile.replace("xl/drawings/", "xl/drawings/_rels/") + ".rels";

				const relsMap: { [rId: string]: string } = {};
				if (zip.files[relsFile]) {
					const relsXml = await zip.files[relsFile].async("string");
					const parser = new DOMParser();
					const relsDoc = parser.parseFromString(relsXml, "text/xml");
					const relationships = relsDoc.getElementsByTagName("Relationship");
					for (let i = 0; i < relationships.length; i++) {
						const id = relationships[i].getAttribute("Id");
						const target = relationships[i].getAttribute("Target");
						if (id && target) {
							relsMap[id] = target.replace("../media/", "xl/media/");
						}
					}
				}

				const parser = new DOMParser();
				const xmlDoc = parser.parseFromString(drawingXml, "text/xml");
				const anchors = xmlDoc.querySelectorAll("twoCellAnchor, oneCellAnchor");

				for (let i = 0; i < anchors.length; i++) {
					const anchor = anchors[i];
					const fromRowEl = anchor.querySelector("from row");
					const blipEl = anchor.querySelector("blip");
					if (fromRowEl && blipEl) {
						const rowIdx = parseInt(fromRowEl.textContent || "0", 10);
						const rId = blipEl.getAttribute("r:embed");
						if (rId && relsMap[rId]) {
							const mediaPath = relsMap[rId];
							const mediaFile = zip.files[mediaPath] || zip.files[mediaPath.replace("xl/", "")];
							if (mediaFile) {
								const base64 = await mediaFile.async("base64");
								const ext = mediaPath.endsWith(".png") ? "png" : "jpeg";
								imagesMap[rowIdx] = `data:image/${ext};base64,${base64}`;
							}
						}
					}
				}
			}

			if (Object.keys(imagesMap).length === 0) {
				const mediaFiles = Object.keys(zip.files)
					.filter((fn) => fn.startsWith("xl/media/"))
					.sort();
				for (let idx = 0; idx < mediaFiles.length; idx++) {
					const mediaPath = mediaFiles[idx];
					const base64 = await zip.files[mediaPath].async("base64");
					const ext = mediaPath.endsWith(".png") ? "png" : "jpeg";
					imagesMap[idx + 1] = `data:image/${ext};base64,${base64}`;
				}
			}

			for (let i = 0; i < allRows.length; i++) {
				const excelRowIndex = i + 1;
				if (imagesMap[excelRowIndex]) {
					allRows[i]["รูปถ่าย"] = imagesMap[excelRowIndex];
					allRows[i]["รูปภาพ"] = imagesMap[excelRowIndex];
					allRows[i]["photo_url"] = imagesMap[excelRowIndex];
				}
			}
		} catch (e) {
			console.warn("JSZip image extraction warning:", e);
		}

		return allRows;
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
			setResult(null);
			setProgress({ current: 0, total: 0 });
			setCurrentPage(1);
		}
	};

	const handlePreview = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) {
			setError("กรุณาเลือกไฟล์ Excel ก่อนทำการตรวจสอบ");
			return;
		}

		setLoading(true);
		setError(null);
		setResult(null);
		setProgress({ current: 0, total: 0 });

		const token = localStorage.getItem("token");
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

		try {
			const allParsedRows = await parseFileOnClient(file);
			const totalRows = allParsedRows.length;
			if (totalRows === 0) {
				setError("ไม่พบข้อมูลในไฟล์ Excel");
				return;
			}

			setProgress({ current: 0, total: totalRows });
			const BATCH_SIZE = 25;
			const combinedPreviewData: any[] = [];

			for (let i = 0; i < totalRows; i += BATCH_SIZE) {
				const batchRows = allParsedRows.slice(i, i + BATCH_SIZE);
				const response = await fetch(
					`${backendUrl}/api/v1/immigrants/upload-excel-illegal?action=preview`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
						},
						body: JSON.stringify({ rows: batchRows }),
					}
				);

				const data = await response.json();
				if (!data.success) {
					throw new Error(data.message || `เกิดข้อผิดพลาดในการประมวลผลแถวที่ ${i + 1}`);
				}

				if (data.preview_data) {
					const offset = combinedPreviewData.length;
					const adjustedBatch = data.preview_data.map((item: any, idx: number) => ({
						...item,
						ลำดับที่อ่านได้: offset + idx + 1,
					}));
					combinedPreviewData.push(...adjustedBatch);
				}

				setProgress({ current: Math.min(i + BATCH_SIZE, totalRows), total: totalRows });
			}

			setResult({
				success: true,
				message: `ดึงข้อมูลพรีวิวสำเร็จทั้งหมด ${totalRows} รายการ`,
				total_rows: totalRows,
				preview_data: combinedPreviewData,
			});
			setCurrentPage(1);
		} catch (err: any) {
			setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend ได้: " + err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleConfirmUpload = async () => {
		if (!file) return;
		setIsUploading(true);
		const jobId = Date.now().toString();

		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
		const token = localStorage.getItem("token");

		try {
			const allParsedRows = await parseFileOnClient(file);
			const totalRows = allParsedRows.length;
			setProgress({ current: 0, total: totalRows });

			const BATCH_SIZE = 25;

			for (let i = 0; i < totalRows; i += BATCH_SIZE) {
				const batchRows = allParsedRows.slice(i, i + BATCH_SIZE);
				const response = await fetch(
					`${backendUrl}/api/v1/immigrants/upload-excel-illegal?action=upload&jobId=${jobId}`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
						},
						body: JSON.stringify({ rows: batchRows }),
					}
				);

				const data = await response.json();
				if (!data.success) {
					throw new Error(data.message || `บันทึกแถวที่ ${i + 1} ล้มเหลว`);
				}

				setProgress({ current: Math.min(i + BATCH_SIZE, totalRows), total: totalRows });
			}

			Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: `นำเข้าและบันทึกข้อมูลเรียบร้อยแล้วทั้งหมด ${totalRows} รายการ`,
				timer: 2000,
				showConfirmButton: false,
			});
			setResult(null);
			setFile(null);
		} catch (err: any) {
			setError("การอัปโหลดล้มเหลว: " + err.message);
		} finally {
			setIsUploading(false);
			setProgress({ current: 0, total: 0 });
		}
	};

	const renderNull = (text = "null") => (
		<span className="text-(--shadow)ic text-xs font-normal">{text}</span>
	);

	const paginatedData = result?.preview_data?.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);
	const totalPages = Math.ceil((result?.preview_data?.length || 0) / itemsPerPage);

	return (
		<div className="bg-background text-foreground mx-auto min-h-screen max-w-7xl p-8">
			<div className="mb-8 border-b border-(--wrapper) pb-4">
				<h1 className="text-3xl font-extrabold tracking-tight text-(--blueText)">
					ระบบพรีวิวข้อมูล Excel ก่อนลงฐานข้อมูลจริง
				</h1>
				<p className="mt-2 text-(--header) opacity-70">
					ตรวจสอบความถูกต้องของการ Map ข้อมูลเข้ากับคอลัมน์ใน Database
				</p>
			</div>

			<form
				onSubmit={handlePreview}
				className="mb-8 max-w-xl rounded-xl border border-(--wrapper) bg-(--container) p-6 shadow-sm"
			>
				<div className="flex flex-col gap-4">
					<label className="text-sm font-semibold text-(--blueText)">
						เลือกไฟล์ Excel หรือ Word ของคุณ (.xlsx, .xls, .docx)
					</label>
					<input
						type="file"
						accept=".xlsx, .xls, .docx"
						onChange={handleFileChange}
						className="w-full cursor-pointer rounded-md border border-(--wrapper) bg-(--container) p-2 text-sm text-(--blueText) file:mr-4 file:rounded-md file:border-0 file:bg-(--button) file:px-4 file:py-2 file:text-sm file:font-semibold file:text-(--header) hover:file:opacity-80"
					/>
					<button
						type="submit"
						disabled={loading || isUploading}
						className="w-full rounded-lg bg-(--blueText) px-4 py-2.5 text-sm font-medium text-(--button) shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-(--wrapper) disabled:text-(--header) disabled:opacity-50"
					>
						{loading ? "กำลังประมวลผลและอ่านไฟล์..." : "พรีวิวข้อมูล (ยังไม่บันทึก)"}
					</button>
				</div>
			</form>

			{error && (
				<div className="mb-6 rounded-lg border border-(--redBorder) bg-(--redBG) p-4 text-sm font-medium text-(--redText)">
					⚠️ {error}
				</div>
			)}

			{result && (
				<div className="animate-fadeIn space-y-6">
					<div className="rounded-xl border border-(--wrapper) bg-(--container) p-6 shadow-sm">
						<h3 className="mb-2 text-lg font-bold text-(--blueText)">ยืนยันการนำเข้าข้อมูล</h3>
						<p className="mb-4 text-sm text-(--header) opacity-80">
							ตรวจสอบข้อมูลพรีวิวด้านล่าง หากถูกต้องแล้ว กดปุ่มเพื่อนำเข้าฐานข้อมูลจริง
						</p>
						{isUploading ?
							<div className="w-full">
								<div className="mb-1 flex justify-between text-sm font-semibold text-(--blueText)">
									<span>กำลังบันทึกลง Database...</span>
									<span>
										{progress.current} / {progress.total || result.total_rows} รายการ
									</span>
								</div>
								<div className="h-3 w-full rounded-full bg-(--wrapper)">
									<div
										className="h-3 rounded-full bg-(--blueText) transition-all duration-300"
										style={{
											width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
										}}
									></div>
								</div>
							</div>
						:	<button
								onClick={handleConfirmUpload}
								className="w-full rounded-lg border border-(--greenBorder) bg-(--greenBG) px-4 py-3 font-bold text-(--greenText) shadow-md transition hover:opacity-90"
							>
								ยืนยันบันทึกลงฐานข้อมูล (Illegal Immigrants)
							</button>
						}
					</div>

					<div className="flex items-center justify-between rounded-xl border border-(--greenBorder) bg-(--greenBG) p-5 text-(--greenText) shadow-sm">
						<div>
							<p className="text-lg font-bold text-(--greenText)">✨ {result.message}</p>
							<p className="mt-1 text-sm">
								ข้อมูลพร้อมสำหรับนำเข้าตาราง <strong>illegal_immigrants</strong>
							</p>
						</div>
						<div className="text-right">
							<span className="text-2xl font-black">{result.total_rows}</span>
							<p className="text-xs opacity-80">แถวที่อ่านได้</p>
						</div>
					</div>

					<div>
						<h3 className="mb-4 text-xl font-bold text-(--header)">🔍 ตารางพรีวิวข้อมูล</h3>

						{totalPages > 1 && (
							<div className="mb-4 flex items-center justify-between rounded-xl border border-(--wrapper) bg-(--container) p-4 shadow-sm">
								<button
									disabled={currentPage === 1}
									onClick={() => setCurrentPage((p) => p - 1)}
									className="rounded-md border border-(--wrapper) bg-(--button) px-4 py-2 text-sm font-medium text-(--header) transition hover:bg-(--wrapper) disabled:opacity-50"
								>
									ก่อนหน้า
								</button>
								<span className="text-sm font-medium text-(--header)">
									หน้า {currentPage} จาก {totalPages}
								</span>
								<button
									disabled={currentPage === totalPages}
									onClick={() => setCurrentPage((p) => p + 1)}
									className="rounded-md border border-(--wrapper) bg-(--button) px-4 py-2 text-sm font-medium text-(--header) transition hover:bg-(--wrapper) disabled:opacity-50"
								>
									ถัดไป
								</button>
							</div>
						)}

						<div className="overflow-x-auto rounded-xl border border-(--wrapper) bg-(--button) shadow-md">
							<table className="w-full min-w-[1100px] border-collapse text-left text-sm">
								<thead className="border-b border-(--wrapper) bg-(--container) text-xs font-bold text-(--header) uppercase">
									<tr>
										<th className="w-16 border-r border-(--wrapper) p-4 text-center">แถวที่</th>
										<th className="w-7/12 border-r border-(--wrapper) bg-(--container) p-4 text-(--blueText)">
											ข้อมูลที่จะถูกบันทึกลงฐานข้อมูล (แยกตามชื่อคอลัมน์จริง)
										</th>
										<th className="w-5/12 bg-(--container) p-4 text-(--orangeText)">
											ข้อมูลดิบจาก Excel (Raw Excel Data)
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-(--wrapper)">
									{paginatedData?.map((row: any, idx: number) => (
										<tr key={idx} className="transition hover:bg-(--row-hover)">
											<td className="border-r border-(--wrapper) p-4 text-center align-top font-bold text-(--header) opacity-60">
												{row.ลำดับที่อ่านได้}
											</td>

											<td className="border-r border-(--wrapper) bg-(--container) p-5 align-top text-(--header)">
												<div className="space-y-4">
													{/* Card 1: Names */}
													<div className="rounded-lg border border-(--wrapper) bg-(--button) p-3 shadow-xs">
														<div className="mb-2 text-xs font-bold text-(--blueText) uppercase tracking-wider">
															👤 ชื่อ-นามสกุล (Thai & English)
														</div>
														<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
															<div>
																<span className="inline-block rounded bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 mr-1.5">
																	DB: first_name_th
																</span>
																<span className="font-semibold text-(--header)">{row.first_name_th || renderNull()}</span>
															</div>
															<div>
																<span className="inline-block rounded bg-blue-500/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 mr-1.5">
																	DB: last_name_th
																</span>
																<span className="font-semibold text-(--header)">{row.last_name_th || renderNull()}</span>
															</div>
															{row.first_name_en && (
																<div>
																	<span className="inline-block rounded bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mr-1.5">
																		DB: first_name_en
																	</span>
																	<span className="font-medium">{row.first_name_en}</span>
																</div>
															)}
															{row.last_name_en && (
																<div>
																	<span className="inline-block rounded bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 mr-1.5">
																		DB: last_name_en
																	</span>
																	<span className="font-medium">{row.last_name_en}</span>
																</div>
															)}
														</div>
													</div>

													{/* Card 2: Personal Info & Photo */}
													<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
														<div className="rounded-lg border border-(--wrapper) bg-(--button) p-3 shadow-xs space-y-2 text-sm">
															<div className="text-xs font-bold text-(--blueText) uppercase tracking-wider mb-2">
																📋 ข้อมูลส่วนตัว & เอกสาร
															</div>
															<div>
																<span className="inline-block rounded bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold opacity-70 mr-1.5">
																	DB: dob
																</span>
																<span className="font-medium">{row.date_of_birth || row.dob || renderNull()}</span>
															</div>
															<div>
																<span className="inline-block rounded bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold opacity-70 mr-1.5">
																	DB: gender
																</span>
																<span className="font-medium text-(--blueText)">{row.gender || renderNull()}</span>
															</div>
															<div>
																<span className="inline-block rounded bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold opacity-70 mr-1.5">
																	DB: nationality
																</span>
																<span className="font-medium text-blue-600 dark:text-blue-400">{row.nationality || renderNull()}</span>
															</div>
															<div>
																<span className="inline-block rounded bg-slate-500/10 px-1.5 py-0.5 text-[11px] font-mono font-semibold opacity-70 mr-1.5">
																	DB: passport_id
																</span>
																<span className="font-mono text-xs">{row.passport_id || renderNull()}</span>
															</div>
														</div>

														<div className="rounded-lg border border-(--wrapper) bg-(--button) p-3 shadow-xs flex flex-col items-center justify-center text-center">
															<div className="text-xs font-bold text-(--blueText) uppercase tracking-wider mb-2 self-start">
																🖼️ รูปถ่ายโปรไฟล์
															</div>
															{row.photo_url && (row.photo_url.startsWith("data:image") || row.photo_url.startsWith("http")) ? (
																<div className="flex flex-col items-center gap-1.5">
																	<img
																		src={row.photo_url}
																		alt="รูปโปรไฟล์"
																		className="h-28 w-24 rounded-lg border border-(--wrapper) object-cover shadow-md"
																	/>
																	<span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">✓ มีรูปถ่าย</span>
																</div>
															) : (
																<div className="flex h-28 w-24 items-center justify-center rounded-lg border border-dashed border-(--wrapper) bg-(--container) text-xs text-(--header) opacity-50">
																	ไม่มีรูปภาพ
																</div>
															)}
														</div>
													</div>

													{/* Card 3: Location / Details */}
													<div className="rounded-lg border border-(--wrapper) bg-(--button) p-3 shadow-xs space-y-2 text-sm">
														<div className="text-xs font-bold text-(--blueText) uppercase tracking-wider mb-2">
															📍 ที่อยู่ / สถานที่ตรวจพบ & ทำงาน
														</div>
														<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
															<div>
																<span className="opacity-60 mr-1">[DB: details]:</span>
																<span className="font-medium">{row.detected_location_details || renderNull()}</span>
															</div>
															<div>
																<span className="opacity-60 mr-1">[DB: sub_district]:</span>
																<span className="font-medium">{row.detected_location_sub_district || renderNull()}</span>
															</div>
															<div>
																<span className="opacity-60 mr-1">[DB: district]:</span>
																<span className="font-medium">{row.detected_location_district || renderNull()}</span>
															</div>
															<div>
																<span className="opacity-60 mr-1">[DB: province]:</span>
																<span className="font-medium text-blue-600 dark:text-blue-400">{row.detected_location_province || renderNull()}</span>
															</div>
															{row.workplace && (
																<div className="col-span-2">
																	<span className="opacity-60 mr-1">[DB: workplace]:</span>
																	<span className="font-medium text-(--header)">{row.workplace}</span>
																</div>
															)}
														</div>
													</div>

													{/* Card 4: Screening status */}
													<div className="rounded-lg border border-(--wrapper) bg-(--button) p-3 shadow-xs space-y-2 text-xs">
														<div className="font-bold text-(--blueText) mb-1.5">⚖️ ผลการคัดกรองสถานะ</div>
														<div className="mb-2">
															<span className="opacity-60 mr-2">[DB: is_victim]:</span>
															{row.is_victim === "YES" ?
																<span className="inline-flex items-center rounded border border-red-300 bg-red-100 px-2 py-0.5 font-bold text-red-700">
																	YES (เป็นผู้เสียหาย)
																</span>
															: row.is_victim === "NO" ?
																<span className="inline-flex items-center rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">
																	NO (ไม่เป็นผู้เสียหาย)
																</span>
															:	<span className="inline-flex items-center rounded border border-stone-300 bg-stone-100 px-2 py-0.5 font-bold text-stone-700">
																	PENDING (ไม่คัดกรองสถานะ)
																</span>
															}
														</div>
														{row.screening_details && (
															<div>
																<span className="font-semibold block mb-1">[DB: screening_details]:</span>
																<div className="rounded border border-(--wrapper) bg-(--container) p-2 text-xs font-medium whitespace-pre-wrap">
																	{row.screening_details}
																</div>
															</div>
														)}
													</div>
												</div>
											</td>

											<td className="bg-(--button) p-4 align-top">
												<pre className="sticky top-4 max-h-[550px] overflow-y-auto rounded-lg border border-(--wrapper) bg-(--container) p-3 font-mono text-xs whitespace-pre-wrap text-(--header) shadow-inner">
													{JSON.stringify(formatRawExcelData(row.raw_data_from_excel), null, 2)}
												</pre>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
