import React, { useState } from "react";
import Swal from "sweetalert2";

import { getValidImageUrl } from "@/lib/imageUrl";
import { IllegalRequestData, UpdateIllegalRequest } from "@/lib/schema/illegal";
import { getIllegalById, updateIllegal } from "@/lib/service/illegal";

function parseToFormValues(data: Partial<IllegalData> | null): UpdateIllegalRequest {
	return {
		first_name_th: data?.first_name_th ?? "",
		middle_name_th: data?.middle_name_th ?? "",
		last_name_th: data?.last_name_th ?? "",
		first_name_en: data?.first_name_en ?? "",
		middle_name_en: data?.middle_name_en ?? "",
		last_name_en: data?.last_name_en ?? "",
		gender: data?.gender ?? "",
		date_of_birth: data?.date_of_birth?.split("T")[0] ?? "",
		passport_id: data?.passport_id ?? "",
		nationality: data?.nationality ?? "",
		photo_url: data?.photo_url ?? "",

		detected_location_details: data?.detected_location_details ?? "",
		detected_location_province: data?.detected_location_province ?? "",
		detected_location_district: data?.detected_location_district ?? "",
		detected_location_sub_district: data?.detected_location_sub_district ?? "",

		detected_date: data?.detected_date?.split("T")[0] || "",
		is_victim: data?.is_victim ?? "",
		screening_details: data?.screening_details ?? "",
		workplace: data?.workplace ?? "",

		note: data?.note ?? "",
	};
}

export type IllegalDetail = {
	states: {
		initData: IllegalData | null;
		formData: IllegalRequestData;
		imagePreview: string | null;
		passportImagePreview: string | null;
		imageFile: File | null;
		passportFile: File | null;
		note: string;
		isFound: boolean | undefined;
		isEditing: boolean;
		isSaving: boolean;
	};
	actions: {
		fetchData: () => ReturnType<typeof getIllegalById>;
		setFormData: React.Dispatch<React.SetStateAction<UpdateIllegalRequest>>;
		setNote: React.Dispatch<React.SetStateAction<string>>;
		setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
		setImageFile: React.Dispatch<React.SetStateAction<File | null>>;
		setPassportFile: React.Dispatch<React.SetStateAction<File | null>>;
	};
	handlers: {
		handleInputChange: React.ChangeEventHandler<HTMLInputElement>;
		handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement>;
		handleSave: React.SubmitEventHandler;
	};
};

export function useIllegalDetail(id: string): IllegalDetail {
	const [initData, setInitData] = useState<IllegalData | null>(null);
	const [formData, setFormData] = useState<UpdateIllegalRequest>(parseToFormValues(initData));
	const [note, setNote] = useState<string>("");
	const [imagePreview, setImagePreview] = useState<string>("");
	const [passportImagePreview, setPassportImagePreview] = useState<string>("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [passportFile, setPassportFile] = useState<File | null>(null);
	const [isFound, setIsFound] = useState<boolean | undefined>(undefined);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const fetchData = async () => {
		const response = await getIllegalById(id);

		const initData = response.success ? response.data : null;

		setIsFound(response.success);
		setInitData(initData);
		setFormData(parseToFormValues(initData));
		setNote(initData?.note ?? "");
		setImagePreview(getValidImageUrl(initData?.photo_url || "") ?? "");
		setPassportImagePreview(getValidImageUrl(initData?.passport_photo_url || "") ?? "");

		return response;
	};

	const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement> = (e) =>
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.checked,
		}));

	const handleSave: React.SubmitEventHandler = async (e) => {
		e.preventDefault();
		setIsSaving(true);
		const response = await updateIllegal(id, {
			...formData,
			photo: imageFile,
			passport_photo: passportFile,
		});

		if (response.success) {
			await Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: "บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว!",
				timer: 1500,
				showConfirmButton: false,
			});

			await fetchData();
			setIsSaving(false);
			setIsEditing(false);
		} else {
			await Swal.fire({
				icon: "error",
				title: "เกิดข้อผิดพลาด",
				text: response.message || "เกิดข้อผิดพลาดในการบันทึก",
			});
		}
	};

	return {
		states: {
			initData,
			formData,
			imagePreview,
			passportImagePreview,
			note,
			imageFile,
			passportFile,
			isFound,
			isEditing,
			isSaving,
		},
		actions: { fetchData, setFormData, setNote, setIsEditing, setImageFile, setPassportFile },
		handlers: {
			handleInputChange,
			handleCheckboxChange,
			handleSave,
		},
	};
}
