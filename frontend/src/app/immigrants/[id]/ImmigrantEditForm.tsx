"use client";

import { Camera as ImageIcon, Save, X } from "lucide-react"; // เปลี่ยนเป็น Camera ป้องกัน Error เวอร์ชัน
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

import AutocompleteInput from "@/components/ui/AutocompleteInput";
import { ALL_NATIONALITIES } from "@/constants/nationalities";
import { useAddressOptions } from "@/hooks/useAddressOptions";

interface ImmigrantEditFormProps {
	id: string;
	personType: "illegal" | "repatriated";
	initialData?: any;
	onCancel?: () => void;
	onSaveSuccess?: () => void;
}

const formatDateForInput = (dateString: string) => {
	if (!dateString) return "";
	try {
		return new Date(dateString).toISOString().split("T")[0];
	} catch (e) {
		return "";
	}
};

export default function ImmigrantEditForm({
	id,
	personType,
	initialData,
	onCancel,
	onSaveSuccess,
}: ImmigrantEditFormProps) {
	const router = useRouter();
	const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

	// 🟢 ฟังก์ชันแปลงลิงก์อัจฉริยะ (ดึงมาจากหน้าการ์ดที่แสดงผลได้สำเร็จ)
	const getFullImageUrl = (url: string) => {
		if (!url) return null;
		if (url.startsWith("blob:")) return url; // ถ้าเป็นรูปที่เพิ่งกดเลือกจากเครื่อง ให้โชว์ตรงๆ

		let driveId = "";

		// ดักจับและแกะ ID ของ Google Drive
		const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
		if (matchFileD && matchFileD[1]) {
			driveId = matchFileD[1];
		} else {
			const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
			if (matchId && matchId[1]) {
				driveId = matchId[1];
			}
		}

		// ถ้าเป็น Google Drive ให้แปลงเป็น Thumbnail + ผ่าน Proxy แก้ CORS
		if (driveId) {
			const thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
			return `https://wsrv.nl/?url=${encodeURIComponent(thumbnailUrl)}`;
		}

		// ถ้าเป็นลิงก์ภายนอกอื่นๆ ให้ผ่าน Proxy แก้ CORS
		if (url.startsWith("http")) {
			return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
		}

		// ถ้าเป็น Path รูปในระบบ Backend ของเราเอง
		const fullUrl = `${backendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
		return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}`;
	};

	const [formData, setFormData] = useState<any>({});
	const [isSaving, setIsSaving] = useState(false);

	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [passportImagePreview, setPassportImagePreview] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [passportFile, setPassportFile] = useState<File | null>(null);

	useEffect(() => {
		if (initialData && Object.keys(initialData).length > 0) {
			const startingData = { ...initialData };

			if (startingData.detected_date)
				startingData.detected_date = formatDateForInput(startingData.detected_date);
			if (startingData.date_of_birth)
				startingData.date_of_birth = formatDateForInput(startingData.date_of_birth);
			if (startingData.return_date)
				startingData.return_date = formatDateForInput(startingData.return_date);

			setFormData(startingData);

			// เรียกใช้ฟังก์ชันแปลงลิงก์ใหม่ตอนดึงข้อมูลเก่ามาใส่ฟอร์ม
			if (startingData.photo_url) setImagePreview(getFullImageUrl(startingData.photo_url));
			if (startingData.passport_photo_url)
				setPassportImagePreview(getFullImageUrl(startingData.passport_photo_url));
		}
	}, [initialData]);

	const defaultImage = personType === "illegal" ? "/enter.png" : "/return.png";
	const inputClass =
		"w-full border px-3 py-1.5 text-sm rounded-sm bg-background !text-black dark:!text-white border-(--wrapper) focus:outline-none transition-all dark:[color-scheme:dark]";
	const labelClass = "block text-xs font-semibold mb-1.5 !text-black dark:!text-white opacity-80";

	const { provinces, districtOptions, subDistrictOptions } = useAddressOptions(
		formData.province || "",
		formData.district || ""
	);
	const {
		provinces: detProvinces,
		districtOptions: detDistrictOptions,
		subDistrictOptions: detSubDistrictOptions,
	} = useAddressOptions(
		formData.detected_location_province || "",
		formData.detected_location_district || ""
	);

	const handleInputChange = (e: any) => {
		const { name, value } = e.target;
		setFormData((prev: any) => ({ ...prev, [name]: value }));
	};

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setImageFile(e.target.files[0]);
			setImagePreview(URL.createObjectURL(e.target.files[0]));
		}
	};

	const handlePassportImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setPassportFile(e.target.files[0]);
			setPassportImagePreview(URL.createObjectURL(e.target.files[0]));
		}
	};

	const handleSelectDistrict = (opt: any) => {
		const { district, province } = opt.extra;
		setFormData((prev: any) => ({ ...prev, district, province }));
	};

	const handleSelectSubDistrict = (opt: any) => {
		const { subDistrict, district, province } = opt.extra;
		setFormData((prev: any) => ({
			...prev,
			sub_district: subDistrict,
			district,
			province,
		}));
	};

	const handleSelectDetDistrict = (opt: any) => {
		const { district, province } = opt.extra;
		setFormData((prev: any) => ({
			...prev,
			detected_location_district: district,
			detected_location_province: province,
		}));
	};

	const handleSelectDetSubDistrict = (opt: any) => {
		const { subDistrict, district, province } = opt.extra;
		setFormData((prev: any) => ({
			...prev,
			detected_location_sub_district: subDistrict,
			detected_location_district: district,
			detected_location_province: province,
		}));
	};

	const handleSave = async (e: React.SubmitEvent) => {
		e.preventDefault();
		setIsSaving(true);
		try {
			const submitData = new FormData();
			Object.keys(formData).forEach((key) => {
				if (
					formData[key] !== null
					&& formData[key] !== undefined
					&& typeof formData[key] !== "object"
				) {
					submitData.append(key, String(formData[key]));
				}
			});
			if (imageFile) submitData.append("photo", imageFile);
			if (passportFile) submitData.append("passport_photo", passportFile);

			// 🟢 1. ดึง token จาก localStorage เหมือนหน้าอื่นๆ (cookie เป็น HttpOnly อ่านจาก JS ไม่ได้)
			const token = localStorage.getItem("token");

			const res = await fetch(`${backendUrl}/api/v1/immigrants/${personType}/${id}`, {
				method: "PUT",
				// 🟢 2. เพิ่ม headers และแนบ token เข้าไป
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: submitData,
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.message || "บันทึกข้อมูลไม่สำเร็จ");
			}

			// โชว์ป๊อปอัพสำเร็จจนครบ 1.5 วิ แล้วรีโหลดหน้าเว็บ 1 ครั้ง (เหมือนกด F5) เพื่อดึงข้อมูลใหม่
			await Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: "บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว!",
				timer: 1500,
				showConfirmButton: false,
			});

			if (onSaveSuccess) onSaveSuccess();
			window.location.reload();
		} catch (error: any) {
			console.error(error);
			Swal.fire({
				icon: "error",
				title: "เกิดข้อผิดพลาด",
				text: error.message || "เกิดข้อผิดพลาดในการบันทึก",
			});
		} finally {
			setIsSaving(false);
		}
	};

	if (!formData || Object.keys(formData).length === 0) {
		return <div className="p-10 text-center">กำลังดึงข้อมูลเก่า...</div>;
	}

	return (
		<div className="mx-auto my-4 max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-(--container) shadow-xl dark:border-zinc-800">
			<div className="p-6 sm:p-8">
				<form onSubmit={handleSave} className="w-full">
					{/* ---------------- รูปภาพ ---------------- */}
					{/* เปลี่ยน bg-background เป็น bg-white และล็อกสีกรอบเป็น border-gray-200 เสมอ */}
					<div className="mb-6 grid grid-cols-1 gap-8 rounded-xl p-6 md:grid-cols-2">
						<div>
							{/* ล็อกสีข้อความเป็น text-slate-800 เพื่อให้อ่านออกเวลาระบบเป็น Dark Mode */}
							<h3 className="mb-4 text-lg font-bold">รูปภาพประจำตัว</h3>
							<div className="flex flex-col items-start gap-4">
								{/* ล็อกตัวรูปภาพให้มีพื้นหลัง bg-white และกรอบสีเทาอ่อน border-gray-200 ตลอดเวลา */}
								<img
									src={imagePreview || defaultImage}
									alt="Preview"
									referrerPolicy="no-referrer"
									onError={(e) => {
										e.currentTarget.src = defaultImage;
									}}
									className="h-40 w-40 rounded-xl border border-gray-200 bg-white object-cover p-1 shadow-sm"
								/>
								{/* ล็อกสีปุ่มให้อยู่ในโทนเข้มเสมอกับพื้นหลังขาว */}
								<label className="flex cursor-pointer items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm text-white hover:opacity-90">
									<ImageIcon size={16} /> {imagePreview ? "แก้ไขรูปประจำตัว" : "อัปโหลดรูปประจำตัว"}
									<input
										type="file"
										accept="image/*"
										onChange={handleImageChange}
										className="hidden"
									/>
								</label>
							</div>
						</div>

						<div>
							{/* ล็อกสีข้อความเป็น text-slate-800 */}
							<h3 className="mb-4 text-lg font-bold">รูปถ่ายพาสปอร์ต</h3>
							<div className="flex flex-col items-start gap-4">
								{/* ล็อกตัวรูปภาพให้มีพื้นหลัง bg-white และกรอบสีเทาอ่อน border-gray-200 ตลอดเวลา */}
								<img
									src={passportImagePreview || "/passport.png"}
									alt="Passport Preview"
									referrerPolicy="no-referrer"
									onError={(e) => {
										e.currentTarget.src = "/passport.png";
									}}
									className="h-40 w-40 rounded-xl border border-gray-200 bg-white object-cover p-1 shadow-sm"
								/>
								{/* ล็อกสีปุ่มให้อยู่ในโทนเข้มเสมอกับพื้นหลังขาว */}
								<label className="flex cursor-pointer items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm text-white hover:opacity-90">
									<ImageIcon size={16} />{" "}
									{passportImagePreview ? "แก้ไขรูปพาสปอร์ต" : "อัปโหลดรูปพาสปอร์ต"}
									<input
										type="file"
										accept="image/*"
										onChange={handlePassportImageChange}
										className="hidden"
									/>
								</label>
							</div>
						</div>
					</div>

					{/* ---------------- ข้อมูลส่วนบุคคล ---------------- */}
					<h3 className="mt-8 mb-4 text-xl font-bold text-(--header)">
						ข้อมูลส่วนบุคคลและชื่อ-นามสกุล
					</h3>
					<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
						<div>
							<label className={labelClass}>ชื่อต้นภาษาไทย *</label>
							<input
								type="text"
								name="first_name_th"
								value={formData.first_name_th || ""}
								onChange={handleInputChange}
								required
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>ชื่อกลางภาษาไทย</label>
							<input
								type="text"
								name="middle_name_th"
								value={formData.middle_name_th || ""}
								onChange={handleInputChange}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>นามสกุลภาษาไทย *</label>
							<input
								type="text"
								name="last_name_th"
								value={formData.last_name_th || ""}
								onChange={handleInputChange}
								required
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
								value={formData.first_name_en || ""}
								onChange={handleInputChange}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>ชื่อกลางภาษาอังกฤษ</label>
							<input
								type="text"
								name="middle_name_en"
								value={formData.middle_name_en || ""}
								onChange={handleInputChange}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>นามสกุลภาษาอังกฤษ</label>
							<input
								type="text"
								name="last_name_en"
								value={formData.last_name_en || ""}
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
								value={formData.passport_id || ""}
								onChange={handleInputChange}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>สัญชาติ</label>
							<AutocompleteInput
								name="nationality"
								value={formData.nationality || ""}
								options={ALL_NATIONALITIES}
								onChange={handleInputChange}
								className={inputClass}
							/>
						</div>
						<div>
							<label className={labelClass}>เพศ</label>
							<select
								name="gender"
								value={formData.gender || ""}
								onChange={handleInputChange}
								className={inputClass}
							>
								<option value="">ไม่ระบุ</option>
								<option value="ชาย">ชาย</option>
								<option value="หญิง">หญิง</option>
							</select>
						</div>
					</div>

					{/* ---------------- แยกฝั่งตามประเภท (Illegal vs Repatriated) ---------------- */}
					{personType === "illegal" ?
						<>
							<h3 className="mt-8 mb-4 text-xl font-bold text-(--header)">
								รายละเอียดจุดตรวจเจอและการคัดกรอง
							</h3>
							<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
								<div>
									<label className={labelClass}>วันที่ตรวจพบ</label>
									<input
										type="date"
										name="detected_date"
										value={formData.detected_date || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>สถานที่ทำงานปลายทาง</label>
									<input
										type="text"
										name="workplace"
										value={formData.workplace || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
							</div>
							<div className="mb-5">
								<label className={labelClass}>
									รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่ ฯลฯ) *
								</label>
								<textarea
									name="detected_location_details"
									value={formData.detected_location_details || ""}
									onChange={handleInputChange}
									required
									rows={2}
									className={inputClass}
								/>
							</div>
							<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
								<div>
									<label className={labelClass}>จังหวัด</label>
									<AutocompleteInput
										name="detected_location_province"
										value={formData.detected_location_province || ""}
										options={detProvinces}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>เขต/อำเภอ</label>
									<AutocompleteInput
										name="detected_location_district"
										value={formData.detected_location_district || ""}
										options={detDistrictOptions}
										onChange={handleInputChange}
										onSelectOption={handleSelectDetDistrict}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>แขวง/ตำบล</label>
									<AutocompleteInput
										name="detected_location_sub_district"
										value={formData.detected_location_sub_district || ""}
										options={detSubDistrictOptions}
										onChange={handleInputChange}
										onSelectOption={handleSelectDetSubDistrict}
										className={inputClass}
									/>
								</div>
							</div>

							<div className="bg-background mb-5 flex items-center gap-2 rounded-xl border border-(--wrapper) p-4">
								{/* คอลัมน์ is_victim ใน DB เป็น enum YES/NO/PENDING ไม่ใช่ boolean */}
								<input
									type="checkbox"
									id="is_victim"
									name="is_victim"
									checked={formData.is_victim === "YES"}
									onChange={(e) =>
										setFormData((prev: any) => ({
											...prev,
											is_victim: e.target.checked ? "YES" : "NO",
										}))
									}
									className="h-4 w-4 cursor-pointer"
								/>
								<label
									htmlFor="is_victim"
									className="cursor-pointer text-sm font-bold text-black! dark:text-white!"
								>
									เข้าข่ายเป็นผู้เสียหายตกเป็นเหยื่อจากการค้ามนุษย์
								</label>
							</div>

							<div className="mb-5">
								<label className={labelClass}>บันทึกรายละเอียดผลการคัดกรอง</label>
								<textarea
									name="screening_details"
									value={formData.screening_details || ""}
									onChange={handleInputChange}
									rows={3}
									className={inputClass}
								/>
							</div>
						</>
					:	<>
							<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
								<div>
									<label className={labelClass}>วันเดือนปีเกิด</label>
									<input
										type="date"
										name="date_of_birth"
										value={formData.date_of_birth || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>อายุปัจจุบัน (ปี)</label>
									<input
										type="number"
										name="age"
										value={formData.age || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>เลขประจำตัวประชาชน *</label>
									<input
										type="text"
										name="national_id"
										value={formData.national_id || ""}
										onChange={handleInputChange}
										required
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
									name="address_details"
									value={formData.address_details || ""}
									onChange={handleInputChange}
									required
									rows={2}
									className={inputClass}
								/>
							</div>
							<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3">
								<div>
									<label className={labelClass}>จังหวัด</label>
									<AutocompleteInput
										name="province"
										value={formData.province || ""}
										options={provinces}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>เขต/อำเภอ</label>
									<AutocompleteInput
										name="district"
										value={formData.district || ""}
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
										value={formData.sub_district || ""}
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
										value={formData.building || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>ชั้น (Floor)</label>
									<input
										type="text"
										name="floor"
										value={formData.floor || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>ห้อง (Room)</label>
									<input
										type="text"
										name="room"
										value={formData.room || ""}
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
										value={formData.job_type || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>หน้าที่ (Role)</label>
									<input
										type="text"
										name="role"
										value={formData.role || ""}
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
										value={formData.salary || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>จ่ายโดย (Paid By)</label>
									<input
										type="text"
										name="paid_by"
										value={formData.paid_by || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>วิธีชำระเงิน (Payment Method)</label>
									<input
										type="text"
										name="payment_method"
										value={formData.payment_method || ""}
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
										value={formData.return_date || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>จำนวนเคสคดี</label>
									<input
										type="number"
										name="number_of_case"
										value={formData.number_of_case || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
								<div>
									<label className={labelClass}>จำนวนหมายจับ</label>
									<input
										type="number"
										name="number_of_warrant"
										value={formData.number_of_warrant || ""}
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
										value={formData.responsible_agency || ""}
										onChange={handleInputChange}
										className={inputClass}
									/>
								</div>
							</div>

							<div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-1">
								<div>
									<label className={labelClass}>สถานะผู้เสียหาย (Victim Status)</label>
									<select
										name="is_victim"
										value={formData.is_victim || "PENDING"}
										onChange={handleInputChange}
										className={inputClass}
									>
										<option value="PENDING">PENDING</option>
										<option value="YES">YES</option>
										<option value="NO">NO</option>
									</select>
								</div>
							</div>
						</>
					}

					{/* ---------------- หมายเหตุและปุ่มกด ---------------- */}
					<div className="mt-8 mb-5">
						<label className={labelClass}>หมายเหตุเพิ่มเติม (Note)</label>
						<textarea
							name="note"
							value={formData.note || ""}
							onChange={handleInputChange}
							rows={3}
							className={inputClass}
						/>
					</div>

					<div className="mt-8 flex justify-end gap-3 border-t border-(--wrapper) pt-6">
						<button
							type="button"
							onClick={() => (onCancel ? onCancel() : router.back())}
							className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-stone-200 px-4 py-2 text-sm font-bold text-slate-800 transition hover:opacity-90 dark:bg-stone-800 dark:text-slate-200"
						>
							<X size={16} /> ยกเลิก
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="text-background flex cursor-pointer items-center gap-1.5 rounded-lg bg-(--header) px-4 py-2 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
						>
							<Save size={16} /> {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
