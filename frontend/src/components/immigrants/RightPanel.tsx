"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Swal from "sweetalert2";

import { deleteIllegal, updateIllegal } from "@/lib/service/illegal";
import { deleteRepatriated, updateRepatriated } from "@/lib/service/repatriated";

interface RightPanelProps {
	type: "repatriated" | "illegal";
	data: any;
	note: string;
	setNote: (value: string) => void;
	onEditClick: () => void;
}

export default function RightPanel({ type, data, note, setNote, onEditClick }: RightPanelProps) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);
	const [isSavingNote, setIsSavingNote] = useState(false);

	const handleSaveNote = async () => {
		try {
			setIsSavingNote(true);
			const endpoint = type === "repatriated" ? "repatriated" : "illegal";

			const payload = { ...data, note: note };

			// ฟอร์แมตวันที่และตัวเลข
			if (type === "repatriated") {
				payload.number_of_case = parseInt(payload.number_of_case) || 0;
				payload.number_of_warrant = parseInt(payload.number_of_warrant) || 0;
				payload.age = parseInt(payload.age) || "";
				if (payload.date_of_birth)
					payload.date_of_birth = String(payload.date_of_birth).split("T")[0];
				if (payload.return_date) payload.return_date = String(payload.return_date).split("T")[0];
			} else {
				if (payload.detected_date)
					payload.detected_date = String(payload.detected_date).split("T")[0];
			}

			if (endpoint == "repatriated") {
				const response = await updateRepatriated(data.id, { ...data });
				if (!response.success) {
					throw new Error(response.message || "Failed to save note to database");
				}
			} else {
				const response = await updateIllegal(data.id, { ...data });
				if (!response.success) {
					throw new Error(response.message || "Failed to save note to database");
				}
			}
			Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: "บันทึกหมายเหตุระบบเรียบร้อยแล้ว!",
				timer: 1500,
				showConfirmButton: false,
			});
		} catch (error) {
			console.error("Error saving note:", error);
			Swal.fire({
				icon: "error",
				title: "เกิดข้อผิดพลาด",
				text: `เกิดข้อผิดพลาดในการบันทึกหมายเหตุ: ${error}`,
			});
		} finally {
			setIsSavingNote(false);
		}
	};

	const handleDelete = async () => {
		const result = await Swal.fire({
			title: "ยืนยันการลบ?",
			text: "ยืนยันที่จะลบประวัติของบุคคลนี้ออกจากระบบอย่างถาวร?",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#ef4444", // สีแดง (Danger)
			cancelButtonColor: "#6b7280", // สีเทา (Cancel)
			confirmButtonText: "ใช่, ลบเลย!",
			cancelButtonText: "ยกเลิก",
		});

		// ถ้าผู้ใช้กด "ยกเลิก" หรือปิดหน้าต่าง ให้หยุดการทำงาน (return ออกไป)
		if (!result.isConfirmed) return;

		try {
			setIsDeleting(true);
			const endpoint = type === "repatriated" ? "repatriated" : "illegal";

			if (endpoint == "repatriated") {
				const response = await deleteRepatriated(data.id);

				if (!response.success) {
					throw new Error("Failed to delete from database");
				}
			} else {
				const response = await deleteIllegal(data.id);
				if (!response.success) {
					throw new Error("Failed to delete from database");
				}
			}

			Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: "ลบข้อมูลออกจากระบบเสร็จสิ้น",
				timer: 1500,
				showConfirmButton: false,
			});
			router.back();
			router.refresh();
		} catch (error) {
			console.error("Error deleting record:", error);
			Swal.fire({
				icon: "error",
				title: "เกิดข้อผิดพลาด",
				text: "เกิดข้อผิดพลาดในการส่งคำสั่งลบข้อมูลไปยังฐานข้อมูล",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	const formatDate = (dateStr: string) => {
		if (!dateStr) return "-";
		return new Date(dateStr).toLocaleDateString("th-TH", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	return (
		<div className="flex w-full flex-col gap-6">
			<div className="rounded-2xl border border-(--wrapper) bg-(--container) p-6 shadow-sm transition-colors">
				{type === "repatriated" ?
					<div className="flex flex-col gap-3">
						<h3 className="mb-2 text-xl font-bold text-(--header)">ข้อมูลเพิ่มเติม</h3>

						<div className="flex items-center justify-between border-b border-(--wrapper) pb-2 text-sm">
							<span className="text- (--foreground) ]dark:text-slate-300 font-bold">
								วันที่ส่งกลับ
							</span>
							<span className="font-mono font-semibold">{formatDate(data.return_date)}</span>
						</div>

						<div className="flex items-center justify-between border-b border-(--wrapper) pb-2 text-sm">
							<span className="text- (--foreground) ]dark:text-slate-300 font-bold">
								จำนวน Case ID
							</span>
							<span className="font-mono font-semibold">{data.number_of_case ?? 0}</span>
						</div>

						<div className="flex items-center justify-between border-b border-(--wrapper) pb-2 text-sm">
							<span className="text- (--foreground) ]dark:text-slate-300 font-bold">
								จำนวนหมายจับ
							</span>
							<span
								className={`font-mono font-semibold ${data.number_of_warrant > 0 ? "text-(--redText)" : ""}`}
							>
								{data.number_of_warrant ?? 0}
							</span>
						</div>
					</div>
				:	<div className="flex flex-col gap-3">
						<h3 className="mb-2 text-xl font-bold text-(--header)">ข้อมูลคัดกรอง</h3>

						<div
							className={`w-full rounded-lg border px-4 py-2 text-center text-sm font-bold shadow-sm ${
								data.is_victim === true || data.is_victim === "YES" || data.is_victim === "true" ?
									"border-red-300 bg-red-100 text-red-700"
								: (
									data.is_victim === false || data.is_victim === "NO" || data.is_victim === "false"
								) ?
									"border-emerald-300 bg-emerald-100 text-emerald-700"
								:	"border-(--yellowBorder) bg-(--yellowBG) text-(--yellowText)"
							}`}
						>
							{data.is_victim === true || data.is_victim === "YES" || data.is_victim === "true" ?
								"เข้าข่ายเป็นผู้เสียหายจากการค้ามนุษย์"
							: data.is_victim === false || data.is_victim === "NO" || data.is_victim === "false" ?
								"ไม่เป็นผู้เสียหายจากการค้ามนุษย์"
							:	"ไม่คัดกรองสถานะ"}
						</div>

						<div className="bg-background text- (--foreground) ]dark:text-slate-300 mt-2 min-h-15 rounded-md border border-(--wrapper) p-3 text-xs leading-relaxed font-medium whitespace-pre-wrap shadow-inner">
							{data.screening_details || "ไม่มีรายละเอียดการคัดกรองระบุไว้"}
						</div>
					</div>
				}

				<div className="mt-6 flex flex-col gap-2 border-t border-(--wrapper) pt-4">
					<label className="text-lg font-bold text-(--header)">หมายเหตุระบบ</label>
					<textarea
						value={note}
						onChange={(e) => setNote(e.target.value)}
						rows={3}
						className="bg-background text-foreground w-full rounded-md border border-(--wrapper) p-3 text-xs shadow-inner focus:ring-2 focus:ring-(--header)/40 focus:outline-none"
						placeholder="ไม่มีบันทึกหมายเหตุ..."
					/>
					<button
						onClick={handleSaveNote}
						disabled={isSavingNote}
						className="text-foreground mt-1 w-full cursor-pointer rounded-md bg-(--wrapper) py-2 text-xs font-bold shadow-sm transition hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSavingNote ? "กำลังบันทึก..." : "บันทึก/อัปเดตหมายเหตุ"}
					</button>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<button
					onClick={onEditClick}
					className="cursor-pointer rounded-lg border border-(--yellowBorder) bg-(--yellowBG) py-2.5 text-center text-sm font-bold text-(--yellowText) shadow-sm transition hover:opacity-90 active:scale-95"
				>
					แก้ไขข้อมูล
				</button>

				<button
					onClick={handleDelete}
					disabled={isDeleting}
					className={`rounded-lg border border-(--redBorder) bg-(--redBG) py-2.5 text-center text-sm font-bold text-(--redText) shadow-sm transition hover:opacity-90 active:scale-95 ${isDeleting ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
				>
					{isDeleting ? "กำลังลบ..." : "ลบข้อมูล"}
				</button>
			</div>
		</div>
	);
}
