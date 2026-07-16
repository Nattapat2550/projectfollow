"use client";

import { useState } from "react";
import Swal from "sweetalert2";
export default function TestUploadPage() {
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState({ current: 0, total: 0 });
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 50;

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

		const formData = new FormData();
		formData.append("file", file);

		// 🟢 ดึง Token จาก LocalStorage
		const token = localStorage.getItem("token");

		try {
			const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
			const response = await fetch(
				`${backendUrl}/api/v1/immigrants/upload-excel-illegal?action=preview`,
				{
					method: "POST",
					headers: {
						...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
					},
					body: formData,
				}
			);

			const data = await response.json();

			if (data.success) {
				setResult(data);
				setCurrentPage(1);
			} else {
				setError(data.message || "เกิดข้อผิดพลาดในการอ่านไฟล์");
			}
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

		const interval = setInterval(async () => {
			try {
				const res = await fetch(`${backendUrl}/api/v1/immigrants/upload-progress/${jobId}`);
				const data = await res.json();
				setProgress({ current: data.current, total: data.total });
				if (data.status === "completed") clearInterval(interval);
			} catch (e) {}
		}, 1000);

		const formData = new FormData();
		formData.append("file", file);

		// 🟢 ดึง Token จาก LocalStorage
		const token = localStorage.getItem("token");

		try {
			const response = await fetch(
				`${backendUrl}/api/v1/immigrants/upload-excel-illegal?action=upload&jobId=${jobId}`,
				{
					method: "POST",
					headers: {
						...(token && token !== "null" ? { Authorization: `Bearer ${token}` } : {}),
					},
					body: formData,
				}
			);

			const data = await response.json();
			if (data.success) {
				Swal.fire({
					icon: "success",
					title: "สำเร็จ!",
					text: data.message,
					timer: 1500,
					showConfirmButton: false,
				});
				setResult(null);
				setFile(null);
			} else {
				setError(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
			}
		} catch (err: any) {
			setError("การอัปโหลดล้มเหลว: " + err.message);
		} finally {
			clearInterval(interval);
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
							<table className="w-full min-w-200 border-collapse text-left text-sm">
								<thead className="border-b border-(--wrapper) bg-(--container) text-xs font-bold text-(--header) uppercase">
									<tr>
										<th className="w-16 border-r border-(--wrapper) p-4 text-center">แถวที่</th>
										<th className="w-3/5 border-r border-(--wrapper) bg-(--container) p-4 text-(--blueText)">
											ข้อมูลที่จะถูกบันทึกลงฐานข้อมูล (แยกตามชื่อคอลัมน์จริง)
										</th>
										<th className="w-2/5 bg-(--container) p-4 text-(--orangeText)">
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

											<td className="border-r border-(--wrapper) bg-(--container) p-4 align-top text-(--header) opacity-95">
												<div className="mb-3 grid grid-cols-2 gap-4 border-b border-(--wrapper) pb-3">
													<div>
														<span className="mb-1 block text-[10px] font-semibold tracking-wider text-(--header) uppercase opacity-50">
															หมวดหมู่ชื่อ (ภาษาไทย)
														</span>
														<div className="text-sm">
															<span className="mr-2 text-(--header) opacity-50">
																[DB: first_name_th]
															</span>
															<span className="font-medium text-(--blueText)">
																{row.first_name_th || renderNull()}
															</span>
														</div>
														<div className="text-sm">
															<span className="mr-2 text-(--header) opacity-50">
																[DB: middle_name_th]
															</span>
															<span className="font-medium text-(--blueText)">
																{row.middle_name_th || renderNull()}
															</span>
														</div>
														<div className="text-sm">
															<span className="mr-2 text-(--header) opacity-50">
																[DB: last_name_th]
															</span>
															<span className="font-medium text-(--blueText)">
																{row.last_name_th || renderNull()}
															</span>
														</div>
													</div>
													<div>
														<span className="mb-1 block text-[10px] font-semibold tracking-wider text-(--header) uppercase opacity-50">
															หมวดหมู่ชื่อ (ภาษาอังกฤษ)
														</span>
														<div className="text-sm">
															<span className="mr-2 text-(--header) opacity-50">
																[DB: first_name_en]
															</span>
															<span className="font-medium text-(--blueText)">
																{row.first_name_en || renderNull()}
															</span>
														</div>
														<div className="text-sm">
															<span className="mr-2 text-(--header) opacity-50">
																[DB: middle_name_en]
															</span>
															<span className="font-medium text-(--blueText)">
																{row.middle_name_en || renderNull()}
															</span>
														</div>
														<div className="text-sm">
															<span className="mr-2 text-(--header) opacity-50">
																[DB: last_name_en]
															</span>
															<span className="font-medium text-(--blueText)">
																{row.last_name_en || renderNull()}
															</span>
														</div>
													</div>
												</div>

												<div className="mb-3 grid grid-cols-2 gap-4 border-b border-(--wrapper) pb-3">
													<div>
														<span className="block text-xs text-(--header) opacity-60">
															[DB: nationality] สัญชาติ:
														</span>
														<span className="font-medium">{row.nationality || renderNull()}</span>
													</div>
													<div>
														<span className="block text-xs text-(--header) opacity-60">
															[DB: passport_id] พาสปอร์ต:
														</span>
														<span className="font-mono font-medium text-(--blueText)">
															{row.passport_id || renderNull()}
														</span>
													</div>
													<div>
														<span className="block text-xs text-(--header) opacity-60">
															[DB: gender] เพศ (อัตโนมัติ):
														</span>
														<span className="font-medium">{row.gender || renderNull()}</span>
													</div>
													<div>
														<span className="block text-xs text-zinc-500">
															[DB: detected_date] วันที่ตรวจพบ:
														</span>
														<span className="rounded border border-(--yellowBorder) bg-(--yellowBG) px-1.5 font-medium text-(--yellowText)">
															{row.detected_date || renderNull()}
														</span>
													</div>
												</div>

												<div className="mb-3 grid grid-cols-1 gap-2 border-b border-(--wrapper) pb-3">
													<div className="rounded-md border border-(--wrapper) bg-(--container) p-2">
														<span className="block text-xs font-semibold text-(--blueText)">
															ที่อยู่ / สถานที่ตรวจพบ:
														</span>
														<div className="mt-1 text-sm text-(--header)">
															<span className="mr-2 text-xs opacity-60">[DB: details]</span>{" "}
															{row.detected_location_details || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: sub_district]
															</span>{" "}
															{row.detected_location_sub_district || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">[DB: district]</span>{" "}
															{row.detected_location_district || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">[DB: province]</span>{" "}
															{row.detected_location_province || renderNull()}
														</div>
													</div>
													<div className="rounded-md border border-(--wrapper) bg-(--container) p-2">
														<span className="block text-xs font-semibold text-(--blueText)">
															[DB: workplace] สถานที่ทำงาน:
														</span>
														<span className="font-medium text-(--header)">
															{row.workplace || renderNull()}
														</span>
													</div>
												</div>

												<div className="bg- (--container)] border- (--wrapper)] rounded-lg border p-3">
													<span className="text- (--header)] mb-2 block text-[10px] font-semibold tracking-wider uppercase opacity-50">
														หมวดหมู่ผลการคัดกรอง
													</span>

													<div className="mb-2">
														<span className="text- (--header)] mr-2 text-xs opacity-60">
															[DB: is_victim] Status:
														</span>
														{row.is_victim === "YES" ?
															<span className="inline-flex items-center rounded border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
																YES (เป็นผู้เสียหาย)
															</span>
														: row.is_victim === "NO" ?
															<span className="inline-flex items-center rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
																NO (ไม่เป็นผู้เสียหาย)
															</span>
														:	<span className="inline-flex items-center rounded border border-stone-300 bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-700">
																PENDING (ไม่คัดกรองสถานะ)
															</span>
														}
													</div>

													<div>
														<span className="text- (--blueText)] mb-1 block text-xs font-semibold">
															[DB: screening_details] รายละเอียดผลคัดกรอง:
														</span>
														<div className="text- (--header)] bg- (--button)] border- (--wrapper)] min-h-10 rounded-md border p-2 text-sm font-medium whitespace-pre-wrap">
															{row.screening_details || renderNull()}
														</div>
													</div>
												</div>
											</td>

											<td className="bg- (--button)] p-4 align-top">
												<pre className="bg- (--container)] text- (--header)] border- (--wrapper)] sticky top-4 max-h-screen overflow-y-auto rounded-lg border p-3 font-mono text-xs whitespace-pre-wrap shadow-inner">
													{JSON.stringify(row.raw_data_from_excel, null, 2)}
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
