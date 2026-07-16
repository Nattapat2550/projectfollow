import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import { getValidImageUrl } from "@/lib/imageUrl";
import { getIllegalById, updateIllegal } from "@/lib/service/illegal";
import { getRepatriatedById, updateRepatriated } from "@/lib/service/repatriated";

export function useImmigrantDetail(id: string) {
	const [person, setPerson] = useState<any | null>(null);
	const [personType, setPersonType] = useState<"repatriated" | "illegal" | null>(null);
	const [loading, setLoading] = useState(true);
	const [note, setNote] = useState("");

	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<any>({});
	const [isSaving, setIsSaving] = useState(false);
	const [selectedImage, setSelectedImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [selectedPassportImage, setSelectedPassportImage] = useState<File | null>(null);
	const [passportImagePreview, setPassportImagePreview] = useState<string | null>(null);

	const fetchData = async () => {
		setLoading(true);

		const response = await getRepatriatedById(id);

		// ตอนนี้ Backend จะส่ง 200 {success: false} กลับมาแทน 404
		if (response.success) {
			setPerson(response.data);
			setPersonType("repatriated");
			setNote(response.data.note || "");
			setFormData({
				...response.data,
				date_of_birth: response.data.date_of_birth?.split("T")[0] || "",
				return_date: response.data.return_date?.split("T")[0] || "",
			});
			setImagePreview(getValidImageUrl(response.data.photo_url ?? null));
			setPassportImagePreview(getValidImageUrl(response.data.passport_photo_url ?? null));
			setLoading(false);
			return;
		}

		const res = await getIllegalById(id);

		if (res.success) {
			setPerson(res.data);
			setPersonType("illegal");
			setNote(res.data.note || "");
			setFormData({
				...res.data,
				detected_date: res.data.detected_date?.split("T")[0] || "",
			});
			setImagePreview(getValidImageUrl(res.data.photo_url ?? null));
			setPassportImagePreview(getValidImageUrl(res.data.passport_photo_url ?? null));
			setLoading(false);
			return;
		}

		setPerson(null);
		setPersonType(null);
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleInputChange = (e: any) =>
		setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
	const handleCheckboxChange = (e: any) =>
		setFormData((prev: any) => ({
			...prev,
			[e.target.name]: e.target.checked,
		}));
	const handleImageChange = (e: any) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedImage(file);
			setImagePreview(URL.createObjectURL(file));
		}
	};
	const handlePassportImageChange = (e: any) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedPassportImage(file);
			setPassportImagePreview(URL.createObjectURL(file));
		}
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setIsSaving(true);
			const payload = { ...formData };

			if (personType === "repatriated") {
				payload.number_of_case = parseInt(payload.number_of_case) || 0;
				payload.number_of_warrant = parseInt(payload.number_of_warrant) || 0;
				payload.age = parseInt(payload.age) || null;
			}

			const submitData = new FormData();
			Object.keys(payload).forEach((key) => {
				if (payload[key] !== null && payload[key] !== undefined) {
					submitData.append(key, String(payload[key]));
				}
			});
			if (selectedImage) submitData.append("photo", selectedImage);
			if (selectedPassportImage) submitData.append("passport_photo", selectedPassportImage);

			if (personType === "repatriated") {
				const response = await updateRepatriated(id, {
					...payload,
					photo: selectedImage,
					passport_photo: selectedPassportImage,
				});
				if (!response.success) {
					throw new Error(response.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
				}
			} else {
				const response = await updateIllegal(id, {
					...payload,
					photo: selectedImage,
					passport_photo: selectedPassportImage,
				});
				if (!response.success) {
					throw new Error(response.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
				}
			}
			Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: "บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว!",
				timer: 1500,
				showConfirmButton: false,
			});
			setIsEditing(false);
			setSelectedImage(null);
			setSelectedPassportImage(null);
			fetchData();
		} catch (error) {
			Swal.fire({
				icon: "error",
				title: "เกิดข้อผิดพลาด",
				text: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	return {
		states: {
			person,
			personType,
			loading,
			note,
			isEditing,
			formData,
			isSaving,
			imagePreview,
			passportImagePreview,
		},
		actions: { setNote, setIsEditing, fetchData },
		handlers: {
			handleInputChange,
			handleCheckboxChange,
			handleImageChange,
			handlePassportImageChange,
			handleSave,
		},
	};
}
