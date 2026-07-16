import React, { useState } from "react";
import Swal from "sweetalert2";

import { getValidImageUrl } from "@/lib/imageUrl";
import { RepatriatedRequestData, UpdateRepatriatedRequest } from "@/lib/schema/repatriated";
import { getRepatriatedById, updateRepatriated } from "@/lib/service/repatriated";

function parseToFormValues(data: RepatriatedData | null): UpdateRepatriatedRequest {
	return {
		first_name_th: data?.first_name_th ?? "",
		middle_name_th: data?.middle_name_th ?? "",
		last_name_th: data?.last_name_th ?? "",
		first_name_en: data?.first_name_en ?? "",
		middle_name_en: data?.middle_name_en ?? "",
		last_name_en: data?.last_name_en ?? "",
		gender: data?.gender ?? "",
		date_of_birth: data?.date_of_birth ?? "",
		national_id: data?.national_id ?? "",
		passport_id: data?.passport_id ?? "",
		nationality: data?.nationality ?? "",
		photo_url: data?.photo_url ?? "",

		address_details: data?.address_details ?? "",
		sub_district: data?.sub_district ?? "",
		district: data?.district ?? "",
		province: data?.province ?? "",
		building: data?.building ?? "",
		floor: data?.floor ?? "",
		room: data?.room ?? "",
		job_type: data?.job_type ?? "",
		role: data?.role ?? "",

		salary: data?.salary ?? "",
		paid_by: data?.paid_by ?? "",
		payment_method: data?.payment_method ?? "",

		number_of_case: String(data?.number_of_case || 0),
		number_of_warrant: String(data?.number_of_warrant || 0),
		responsible_agency: data?.responsible_agency ?? "",

		return_date: data?.return_date ?? "",
		note: data?.note ?? "",
	};
}

export type RepatriatedDetail = {
	states: {
		initData: RepatriatedData | null;
		formData: RepatriatedRequestData;
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
		fetchData: () => ReturnType<typeof getRepatriatedById>;
		setFormData: React.Dispatch<React.SetStateAction<UpdateRepatriatedRequest>>;
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

export function useRepatriatedDetail(id: string): RepatriatedDetail {
	const [initData, setInitData] = useState<RepatriatedData | null>(null);
	const [formData, setFormData] = useState<UpdateRepatriatedRequest>(parseToFormValues(initData));
	const [note, setNote] = useState<string>("");
	const [imagePreview, setImagePreview] = useState<string>("");
	const [passportImagePreview, setPassportImagePreview] = useState<string>("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [passportFile, setPassportFile] = useState<File | null>(null);
	const [isFound, setIsFound] = useState<boolean | undefined>(undefined);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const fetchData = async () => {
		const response = await getRepatriatedById(id);

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
		const response = await updateRepatriated(id, {
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
