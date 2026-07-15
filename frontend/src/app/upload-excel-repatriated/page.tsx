"use client";

import { useState } from "react";
import Swal from "sweetalert2";

export default function TestUpload2Page() {
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
			const backendUrl =
				process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

			const response = await fetch(
				`${backendUrl}/api/v1/upload-excel-repatriated/upload-excel?action=preview`,
				{
					method: "POST",
					headers: {
						...(token && token !== "null" ?
							{ Authorization: `Bearer ${token}` }
						:	{}),
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
		const backendUrl =
			process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

		const interval = setInterval(async () => {
			try {
				const res = await fetch(
					`${backendUrl}/api/v1/upload-excel-repatriated/upload-progress/${jobId}`
				);
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
				`${backendUrl}/api/v1/upload-excel-repatriated/upload-excel?action=upload&jobId=${jobId}`,
				{
					method: "POST",
					headers: {
						...(token && token !== "null" ?
							{ Authorization: `Bearer ${token}` }
						:	{}),
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
				setError(data.message || "เกิดข้อผิดพลาด");
			}
		} catch (err: any) {
			setError("ล้มเหลว: " + err.message);
		} finally {
			clearInterval(interval);
			setIsUploading(false);
			setProgress({ current: 0, total: 0 });
		}
	};

	const renderNull = (text = "null") => (
		<span className="text-xs font-normal text-(--shadow) italic">{text}</span>
	);

	const paginatedData = result?.preview_data?.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);
	const totalPages = Math.ceil(
		(result?.preview_data?.length || 0) / itemsPerPage
	);

	return (
		<div className="bg-background text-foreground mx-auto min-h-screen max-w-7xl p-8">
			<div className="mb-8 border-b border-(--wrapper) pb-4">
				<h1 className="text-3xl font-extrabold tracking-tight text-(--blueText)">
					ระบบพรีวิวข้อมูล Excel (ข้อมูลบุคคลส่งกลับ)
				</h1>
				<p className="mt-2 text-(--header) opacity-70">
					ตรวจสอบความถูกต้องของการ Map ข้อมูลบุคคลส่งกลับก่อนนำเข้าฐานข้อมูล
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
						{loading ?
							"กำลังประมวลผลและอ่านไฟล์..."
						:	"พรีวิวข้อมูล (ยังไม่บันทึก)"}
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
						<h3 className="mb-2 text-lg font-bold text-(--blueText)">
							ยืนยันการนำเข้าข้อมูล
						</h3>
						<p className="mb-4 text-sm text-(--header) opacity-80">
							เมื่อกดปุ่มนี้ ระบบจะเริ่มบันทึกข้อมูลและอัปโหลดรูปภาพทั้งหมดขึ้น
							Google Drive ทันที
						</p>
						{isUploading ?
							<div className="w-full">
								<div className="mb-1 flex justify-between text-sm font-semibold text-(--blueText)">
									<span>กำลังบันทึกลง Database & Google Drive...</span>
									<span>
										{progress.current} / {progress.total || result.total_rows}{" "}
										รายการ
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
								ยืนยันบันทึกลงฐานข้อมูลและอัปโหลดรูปภาพ (Repatriated)
							</button>
						}
					</div>

					<div className="flex items-center justify-between rounded-xl border border-(--greenBorder) bg-(--greenBG) p-5 text-(--greenText) shadow-sm">
						<div>
							<p className="text-lg font-bold text-(--greenText)">
								✨ {result.message}
							</p>
							<p className="mt-1 text-sm">
								ข้อมูลพร้อมสำหรับนำเข้าฐานข้อมูลจริง (repatriated_persons)
							</p>
						</div>
						<div className="text-right">
							<span className="text-2xl font-black">{result.total_rows}</span>
							<p className="text-xs opacity-80">แถวที่อ่านได้</p>
						</div>
					</div>

					<div>
						<h3 className="mb-4 text-xl font-bold text-(--header)">
							🔍 ตารางพรีวิวข้อมูล
						</h3>

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
										<th className="w-16 border-r border-(--wrapper) p-4 text-center">
											แถวที่
										</th>
										<th className="border-wrapper w-3/5 border-r bg-(--container) p-4 text-(--blueText)">
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
														<span className="mb-1 block text-[10px] font-semibold text-(--header) uppercase opacity-50">
															ข้อมูลส่วนบุคคล (วันเกิด/เพศ/สัญชาติ)
														</span>
														<div className="text-sm">
															<span className="mr-1 text-(--header) opacity-50">
																[DB: dob]
															</span>{" "}
															<span className="font-medium">
																{row.dob || renderNull()}
															</span>
														</div>
														<div className="text-sm">
															<span className="mr-1 text-(--header) opacity-50">
																[DB: gender]
															</span>{" "}
															<span className="font-medium text-(--blueText)">
																{row.gender || renderNull()}
															</span>
														</div>
														<div className="text-sm">
															<span className="mr-1 text-(--header) opacity-50">
																[DB: nationality]
															</span>{" "}
															<span className="font-medium text-(--blueText)">
																{row.nationality || renderNull()}
															</span>
														</div>
													</div>
													<div>
														<span className="mb-1 block text-[10px] font-semibold text-(--header) uppercase opacity-50">
															เอกสาร / รูปภาพ
														</span>
														<div className="text-sm">
															<span className="mr-1 text-(--header) opacity-50">
																[DB: national_id]
															</span>{" "}
															<span className="font-mono">
																{row.id_card || renderNull()}
															</span>
														</div>
														<div className="text-sm">
															<span className="mr-1 text-(--header) opacity-50">
																[DB: passport_id]
															</span>{" "}
															<span className="font-mono">
																{row.passport || renderNull()}
															</span>
														</div>
														<div className="mt-1 text-sm">
															<span className="mb-2 block text-(--header) opacity-50">
																[DB: photo_url]
															</span>
															{(
																row.photo_url
																&& (row.photo_url.startsWith("data:image")
																	|| row.photo_url.startsWith("http"))
															) ?
																<img
																	src={row.photo_url}
																	alt="พรีวิวรูปโปรไฟล์"
																	className="h-20 w-16 rounded-md border border-(--wrapper) object-cover shadow-sm"
																/>
															:	<span
																	className="block truncate font-medium text-(--orangeText)"
																	title={row.photo_url}
																>
																	{row.photo_url || renderNull()}
																</span>
															}
														</div>
													</div>
												</div>

												<div className="mb-3 grid grid-cols-2 gap-4 border-b border-(--wrapper) pb-3">
													<div className="rounded-md border border-(--wrapper) bg-(--container) p-2">
														<span className="block text-xs font-semibold text-(--blueText)">
															ที่อยู่ (หลังแยกคำ):
														</span>
														<div className="mt-1 text-sm text-(--header)">
															<span className="mr-2 text-xs opacity-60">
																[DB: address_details]
															</span>{" "}
															{row.address_details || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: sub_district]
															</span>{" "}
															{row.sub_district || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: district]
															</span>{" "}
															{row.district || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: province]
															</span>{" "}
															{row.province || renderNull()}
														</div>
													</div>
													<div className="rounded-md border border-(--wrapper) bg-(--container) p-2">
														<span className="block text-xs font-semibold text-(--blueText)">
															ข้อมูลการคดี / หมายจับ / สถานะ:
														</span>
														<div className="mt-1 text-sm text-(--header)">
															<span className="mr-2 text-xs opacity-60">
																[DB: case_id_count] จำนวนคดี:
															</span>{" "}
															<span className="font-semibold">
																{row.case_id_count || 0}
															</span>
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: warrant] หมายจับ:
															</span>{" "}
															<span className="font-semibold">
																{row.warrant || 0}
															</span>
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: is_victim] สถานะผู้เสียหาย:
															</span>{" "}
															{row.is_victim === "YES" ?
																"เป็นผู้เสียหาย"
															: row.is_victim === "NO" ?
																"ไม่เป็นผู้เสียหาย"
															:	"ไม่คัดกรองสถานะ"}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: responsible_agency] หน่วยงาน:
															</span>{" "}
															{row.responsible_agency || renderNull()}
														</div>
													</div>
												</div>

												<div className="mb-3 grid grid-cols-2 gap-4 border-b border-(--wrapper) pb-3">
													<div className="rounded-md border border-(--wrapper) bg-(--container) p-2">
														<span className="block text-xs font-semibold text-(--blueText)">
															ข้อมูลสถานที่ทำงาน:
														</span>
														<div className="mt-1 text-sm text-(--header)">
															<span className="mr-2 text-xs opacity-60">
																[DB: building] ตึก:
															</span>{" "}
															{row.building || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: floor] ชั้น:
															</span>{" "}
															{row.floor || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: room] ห้อง:
															</span>{" "}
															{row.room || renderNull()}
														</div>
													</div>
													<div className="rounded-md border border-(--wrapper) bg-(--container) p-2">
														<span className="block text-xs font-semibold text-(--blueText)">
															ข้อมูลหน้าที่และรายได้:
														</span>
														<div className="mt-1 text-sm text-(--header)">
															<span className="mr-2 text-xs opacity-60">
																[DB: job_type] ประเภทงาน:
															</span>{" "}
															{row.job_type || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: role] ทำหน้าที่:
															</span>{" "}
															{row.role || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: salary] เงินเดือน:
															</span>{" "}
															{row.salary || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: paid_by] รับเงินจาก:
															</span>{" "}
															{row.paid_by || renderNull()}
															<br />
															<span className="mr-2 text-xs opacity-60">
																[DB: payment_method] ช่องทาง:
															</span>{" "}
															{row.payment_method || renderNull()}
														</div>
													</div>
												</div>

												<div className="mb-3 rounded-md border border-(--wrapper) bg-(--container) p-2">
													<span className="block text-xs font-semibold text-(--blueText)">
														ข้อมูลเพิ่มเติม:
													</span>
													<div className="mt-1 text-sm text-(--header)">
														<span className="mr-2 text-xs opacity-60">
															[DB: note] หมายเหตุ:
														</span>{" "}
														{row.note || renderNull()}
													</div>
												</div>
											</td>
											<td className="bg-(--button) p-4 align-top">
												<pre className="sticky top-4 max-h-screen overflow-y-auto rounded-lg border border-(--wrapper) bg-(--container) p-3 font-mono text-xs whitespace-pre-wrap text-(--header) shadow-inner">
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
