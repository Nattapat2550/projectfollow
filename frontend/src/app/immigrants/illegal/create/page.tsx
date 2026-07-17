"use client";

import { ChevronLeft, FileSpreadsheet, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmitEventHandler, useState } from "react";
import Swal from "sweetalert2";

import SingleImageField from "@/components/form/single-image-field";
import { createIllegal } from "@/lib/service/illegal";

import CreateIllegalPageForm from "./form";

export default function CreateIllegalImmigrant() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		first_name_th: "",
		middle_name_th: "",
		last_name_th: "",
		first_name_en: "",
		middle_name_en: "",
		last_name_en: "",
		passport_id: "",
		date_of_birth: "",
		gender: "",
		nationality: "",
		detected_date: "",
		detected_location_details: "",
		detected_location_sub_district: "",
		detected_location_district: "",
		detected_location_province: "",
		is_victim: "PENDING",
		workplace: "",
		screening_details: "",
		note: "",
		photo_url: "",
	});

	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [selectedPassportImage, setSelectedPassportImage] = useState<File | null>(null);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
	) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
		}));
	};

	const handleSubmit: SubmitEventHandler = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const response = await createIllegal({
			...formData,
			photo: selectedImage,
			passport_photo: selectedPassportImage,
		});

		if (response.success) {
			Swal.fire({
				icon: "success", // เปลี่ยนเป็น 'error', 'warning', 'info' ได้
				title: "สำเร็จ!",
				text: "เพิ่มข้อมูลลักลอบเข้าเมืองสำเร็จ!",
				timer: 1500,
				showConfirmButton: false,
			});

			router.push("/immigrants/illegal");
			router.refresh();
		} else {
			setError(response.message || "Something went wrong");
		}
		setLoading(false);
	};

	return (
		<div className="bg-background text-foreground min-h-screen p-6 transition-colors duration-200">
			<div className="mx-auto mb-6 max-w-2xl">
				<button
					onClick={() => router.push("/")}
					className="flex cursor-pointer items-center gap-1 text-2xl font-bold text-(--header) transition hover:opacity-80"
				>
					<ChevronLeft size={32} />
					<span>เพิ่มข้อมูลใหม่ (ผู้ลักลอบเข้าประเทศ)</span>
				</button>
				<Link href="/upload-excel-illegal">
					<button className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-600 transition hover:bg-amber-500/20">
						<FileSpreadsheet size={18} /> อัพโหลดจากไฟล์ Excel
					</button>
				</Link>
			</div>

			<form
				onSubmit={handleSubmit}
				className="mx-auto mb-12 max-w-2xl rounded-2xl border border-gray-100 bg-(--container) p-6 shadow-xl sm:p-8 dark:border-zinc-800"
			>
				{error && (
					<div className="mb-6 rounded-md border border-red-500 bg-red-100 p-4 text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
						{error}
					</div>
				)}

				<div className="mb-6 grid grid-cols-1 gap-8 rounded-xl p-6 md:grid-cols-2">
					<div>
						<h3 className="mb-4 text-lg font-bold">รูปภาพประจำตัว</h3>
						<SingleImageField
							previewUrl="/enter.png"
							props={{ alt: "Person Preview" }}
							uploadLabel="อัปโหลดรูปประจำตัว"
							editLabel="แก้ไขรูปประจำตัว"
							removeLabel="ลบรูปภาพ"
							file={selectedImage}
							setFile={setSelectedImage}
						/>
					</div>
					<div>
						<h3 className="mb-4 text-lg font-bold">รูปถ่ายพาสปอร์ต</h3>
						<SingleImageField
							previewUrl="/passport.png"
							props={{ alt: "Passport Preview" }}
							uploadLabel="อัปโหลดรูปพาสปอร์ต"
							editLabel="แก้ไขรูปพาสปอร์ต"
							removeLabel="ลบรูปภาพ"
							file={selectedPassportImage}
							setFile={setSelectedPassportImage}
						/>
					</div>
				</div>

				<CreateIllegalPageForm
					formData={formData}
					setFormData={setFormData}
					handleInputChange={handleInputChange}
				/>

				<div className="mt-8 flex justify-end gap-3 border-t border-(--wrapper) pt-6">
					<Link href="/">
						<button
							type="button"
							className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-stone-200 px-4 py-2 text-sm font-bold text-slate-800 transition hover:opacity-90 active:scale-[0.98] dark:bg-stone-800 dark:text-slate-200"
						>
							<X size={16} /> ยกเลิก
						</button>
					</Link>
					<button
						type="submit"
						disabled={loading}
						className="text-background flex cursor-pointer items-center gap-1.5 rounded-lg bg-(--header) px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
					>
						<Save size={16} /> {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
					</button>
				</div>
			</form>
		</div>
	);
}
