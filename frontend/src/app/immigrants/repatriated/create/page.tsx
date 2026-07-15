"use client";

import {
	ChevronLeft,
	FileSpreadsheet,
	Image as ImageIcon,
	Save,
	X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

import AutocompleteInput from "@/components/ui/AutocompleteInput";
import { ALL_NATIONALITIES } from "@/constants/nationalities";
import { useAddressOptions } from "@/hooks/useAddressOptions";
import { createRepatriated } from "@/lib/service/repatriated";

export default function CreateRepatriatedImmigrant() {
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
		nationality: "",
		national_id: "",
		gender: "",
		date_of_birth: "",
		age: "",
		return_date: "",
		number_of_case: "",
		number_of_warrant: "",
		address_details: "",
		sub_district: "",
		district: "",
		province: "",
		building: "",
		floor: "",
		room: "",
		job_type: "",
		role: "",
		salary: "",
		paid_by: "",
		payment_method: "",
		is_victim: "PENDING",
		responsible_agency: "",
		screening_details: "",
		note: "",
		photo_url: "",
	});

	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [selectedPassportImage, setSelectedPassportImage] =
		useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [passportImagePreview, setPassportImagePreview] = useState<
		string | null
	>(null);

	const { provinces, districtOptions, subDistrictOptions } = useAddressOptions(
		formData.province,
		formData.district
	);

	const handleSelectDistrict = (opt: any) => {
		const { district, province } = opt.extra;
		setFormData((prev) => ({
			...prev,
			district,
			province,
		}));
	};

	const handleSelectSubDistrict = (opt: any) => {
		const { subDistrict, district, province } = opt.extra;
		setFormData((prev) => ({
			...prev,
			sub_district: subDistrict,
			district,
			province,
		}));
	};

	const handleInputChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>
	) => {
		const { name, value, type } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]:
				type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
		}));
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedImage(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};

	const handleImageRemove = () => {
		setSelectedImage(null);
		setImagePreview(null);
	};

	const handlePassportImageChange = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedPassportImage(file);
			setPassportImagePreview(URL.createObjectURL(file));
		}
	};

	const handlePassportImageRemove = () => {
		setSelectedPassportImage(null);
		setPassportImagePreview(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const response = await createRepatriated({
			...formData,
			photo: selectedImage,
			passport_photo: selectedPassportImage,
		});

		if (response.success) {
			Swal.fire({
				icon: "success", // เปลี่ยนเป็น 'error', 'warning', 'info' ได้
				title: "สำเร็จ!",
				text: "เพิ่มข้อมูลผู้ถูกส่งตัวกลับสำเร็จ!",
				timer: 1500,
				showConfirmButton: false,
			});
			router.push("/immigrants/repatriated");
			router.refresh();
		} else {
			setError(response.message || "Something went wrong");
		}
		setLoading(false);
	};

	const inputClass =
		"w-full border px-3 py-1.5 text-sm rounded-sm bg-background !text-black dark:!text-white border-(--wrapper) focus:outline-none transition-all dark:[color-scheme:dark]";
	const labelClass =
		"block text-xs font-semibold mb-1.5 !text-black dark:!text-white opacity-80";

	return (
		<div className="bg-background text-foreground min-h-screen p-6 transition-colors duration-200">
			<div className="mx-auto mb-6 max-w-2xl">
				<button
					onClick={() => router.push("/")}
					className="flex cursor-pointer items-center gap-1 text-2xl font-bold text-(--header) transition hover:opacity-80"
				>
					<ChevronLeft size={32} />
					<span>เพิ่มข้อมูลใหม่ (ผู้ถูกส่งตัวกลับ)</span>
				</button>
				<Link href="/upload-excel-repatriated">
					<button className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-600 transition hover:bg-emerald-500/20">
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
						<div className="flex flex-col items-start gap-4">
							<img
								src={imagePreview || "/return.png"}
								alt="Preview"
								referrerPolicy="no-referrer"
								onError={(e) => {
									e.currentTarget.src = "/return.png";
								}}
								className="h-40 w-40 rounded-xl border border-gray-200 bg-white object-cover p-1 shadow-sm"
							/>
							<div className="flex gap-3">
								<label className="flex cursor-pointer items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm text-white hover:opacity-90">
									<ImageIcon size={16} />{" "}
									{imagePreview ? "แก้ไขรูปประจำตัว" : "อัปโหลดรูปประจำตัว"}
									<input
										type="file"
										accept="image/*"
										onChange={handleImageChange}
										className="hidden"
									/>
								</label>
								{imagePreview && (
									<button
										type="button"
										onClick={handleImageRemove}
										className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
									>
										<X size={16} /> ลบรูปภาพ
									</button>
								)}
							</div>
						</div>
					</div>
					<div>
						<h3 className="mb-4 text-lg font-bold">รูปถ่ายพาสปอร์ต</h3>
						<div className="flex flex-col items-start gap-4">
							<img
								src={passportImagePreview || "/passport.png"}
								alt="Passport Preview"
								referrerPolicy="no-referrer"
								onError={(e) => {
									e.currentTarget.src = "/passport.png";
								}}
								className="h-40 w-40 rounded-xl border border-gray-200 bg-white object-cover p-1 shadow-sm"
							/>
							<div className="flex gap-3">
								<label className="flex cursor-pointer items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm text-white hover:opacity-90">
									<ImageIcon size={16} />{" "}
									{passportImagePreview ?
										"แก้ไขรูปพาสปอร์ต"
									:	"อัปโหลดรูปพาสปอร์ต"}
									<input
										type="file"
										accept="image/*"
										onChange={handlePassportImageChange}
										className="hidden"
									/>
								</label>
								{passportImagePreview && (
									<button
										type="button"
										onClick={handlePassportImageRemove}
										className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
									>
										<X size={16} /> ลบรูปภาพ
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				<h3 className="mt-8 mb-4 text-xl font-bold text-(--header)">
					ข้อมูลส่วนบุคคลและชื่อ-นามสกุล
				</h3>
				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
					<div>
						<label className={labelClass}>ชื่อต้นภาษาไทย *</label>
						<input
							required
							type="text"
							name="first_name_th"
							value={formData.first_name_th}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>ชื่อกลางภาษาไทย</label>
						<input
							type="text"
							name="middle_name_th"
							value={formData.middle_name_th}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>นามสกุลภาษาไทย *</label>
						<input
							required
							type="text"
							name="last_name_th"
							value={formData.last_name_th}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
				</div>

				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
					<div>
						<label className={labelClass}>ชื่อต้นภาษาอังกฤษ</label>
						<input
							type="text"
							name="first_name_en"
							value={formData.first_name_en}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>ชื่อกลางภาษาอังกฤษ</label>
						<input
							type="text"
							name="middle_name_en"
							value={formData.middle_name_en}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>นามสกุลภาษาอังกฤษ</label>
						<input
							type="text"
							name="last_name_en"
							value={formData.last_name_en}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
				</div>

				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
					<div>
						<label className={labelClass}>เลขหนังสือเดินทาง</label>
						<input
							type="text"
							name="passport_id"
							value={formData.passport_id}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>สัญชาติ</label>
						<AutocompleteInput
							name="nationality"
							value={formData.nationality}
							options={ALL_NATIONALITIES}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>เพศ</label>
						<select
							name="gender"
							value={formData.gender}
							onChange={handleInputChange}
							className={inputClass}
						>
							<option value="">ไม่ระบุ</option>
							<option value="ชาย">ชาย</option>
							<option value="หญิง">หญิง</option>
						</select>
					</div>
				</div>

				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
					<div>
						<label className={labelClass}>วันเดือนปีเกิด</label>
						<input
							type="date"
							name="date_of_birth"
							value={formData.date_of_birth}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>อายุปัจจุบัน (ปี)</label>
						<input
							type="number"
							name="age"
							value={formData.age}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>เลขประจำตัวประชาชน *</label>
						<input
							required
							type="text"
							name="national_id"
							value={formData.national_id}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
				</div>

				<h3 className="mt-8 mb-4 text-xl font-bold text-(--header)">
					รายละเอียดที่อยู่และการทำงาน
				</h3>
				<div className="mb-5">
					<label className={labelClass}>
						รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่ ฯลฯ) *
					</label>
					<textarea
						required
						name="address_details"
						value={formData.address_details}
						onChange={handleInputChange}
						rows={2}
						className={inputClass}
					/>
				</div>
				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
					<div>
						<label className={labelClass}>จังหวัด</label>
						<AutocompleteInput
							name="province"
							value={formData.province}
							options={provinces}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>เขต/อำเภอ</label>
						<AutocompleteInput
							name="district"
							value={formData.district}
							options={districtOptions}
							onChange={handleInputChange}
							onSelectOption={handleSelectDistrict}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>แขวง/ตำบล</label>
						<AutocompleteInput
							name="sub_district"
							value={formData.sub_district}
							options={subDistrictOptions}
							onChange={handleInputChange}
							onSelectOption={handleSelectSubDistrict}
							className={inputClass}
						/>
					</div>
				</div>
				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
					<div>
						<label className={labelClass}>อาคาร (Building)</label>
						<input
							type="text"
							name="building"
							value={formData.building}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>ชั้น (Floor)</label>
						<input
							type="text"
							name="floor"
							value={formData.floor}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>ห้อง (Room)</label>
						<input
							type="text"
							name="room"
							value={formData.room}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
				</div>

				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
					<div>
						<label className={labelClass}>ประเภทงาน (Job Type)</label>
						<input
							type="text"
							name="job_type"
							value={formData.job_type}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>หน้าที่ (Role)</label>
						<input
							type="text"
							name="role"
							value={formData.role}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
				</div>
				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
					<div>
						<label className={labelClass}>เงินเดือน (Salary)</label>
						<input
							type="number"
							name="salary"
							value={formData.salary}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>จ่ายโดย (Paid By)</label>
						<input
							type="text"
							name="paid_by"
							value={formData.paid_by}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>วิธีชำระเงิน (Payment Method)</label>
						<input
							type="text"
							name="payment_method"
							value={formData.payment_method}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
				</div>

				<h3 className="mt-8 mb-4 text-xl font-bold text-(--header)">
					รายละเอียดการส่งตัวและคดีความ
				</h3>
				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
					<div>
						<label className={labelClass}>วันที่ส่งกลับประเทศ</label>
						<input
							type="date"
							name="return_date"
							value={formData.return_date}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>จำนวนเคสคดี</label>
						<input
							type="number"
							name="number_of_case"
							value={formData.number_of_case}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
					<div>
						<label className={labelClass}>จำนวนหมายจับ</label>
						<input
							type="number"
							name="number_of_warrant"
							value={formData.number_of_warrant}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
				</div>

				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-1">
					<div>
						<label className={labelClass}>หน่วยงานที่รับผิดชอบ</label>
						<input
							type="text"
							name="responsible_agency"
							value={formData.responsible_agency}
							onChange={handleInputChange}
							className={inputClass}
						/>
					</div>
				</div>

				<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-1">
					<div>
						<label className={labelClass}>
							สถานะผู้เสียหาย (Victim Status)
						</label>
						<select
							name="is_victim"
							value={formData.is_victim}
							onChange={handleInputChange}
							className={inputClass}
						>
							<option value="PENDING">ไม่คัดกรองสถานะ</option>
							<option value="YES">เป็นผู้เสียหาย</option>
							<option value="NO">ไม่เป็นผู้เสียหาย</option>
						</select>
					</div>
				</div>

				<div className="mb-5">
					<label className={labelClass}>
						รายละเอียดการคัดกรอง (Screening Details)
					</label>
					<textarea
						name="screening_details"
						value={formData.screening_details}
						onChange={handleInputChange}
						rows={3}
						className={inputClass}
					/>
				</div>

				<div className="mb-5">
					<label className={labelClass}>หมายเหตุเพิ่มเติม (Note)</label>
					<textarea
						name="note"
						value={formData.note}
						onChange={handleInputChange}
						rows={3}
						className={inputClass}
					/>
				</div>

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
