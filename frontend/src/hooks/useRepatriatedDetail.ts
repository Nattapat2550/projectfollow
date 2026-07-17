import React, { useState } from "react";
import Swal from "sweetalert2";

import { getValidImageUrl } from "@/lib/imageUrl";
import { parseRepatriatedToRequest } from "@/lib/initParse";
import { RepatriatedRequestData, UpdateRepatriatedRequest } from "@/lib/schema/repatriated";
import { getRepatriatedById, updateRepatriated } from "@/lib/service/repatriated";

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
	const [formData, setFormData] = useState<UpdateRepatriatedRequest>(
		parseRepatriatedToRequest(initData)
	);
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
		setFormData(parseRepatriatedToRequest(initData));
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
