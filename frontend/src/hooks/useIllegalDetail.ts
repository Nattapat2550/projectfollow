import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Swal from "sweetalert2";

import { getValidImageUrl } from "@/lib/imageUrl";
import { parseIllegalToRequest } from "@/lib/initParse";
import { IllegalRequestData, UpdateIllegalRequest } from "@/lib/schema/illegal";
import { deleteIllegal, getIllegalById, updateIllegal } from "@/lib/service/illegal";
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
		isSavingNote: boolean;
		isDeleting: boolean;
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
		handleInputChange: React.ChangeEventHandler;
		handleCheckboxChange: React.ChangeEventHandler<HTMLInputElement>;
		handleSave: React.SubmitEventHandler;
		handleSaveNote: React.MouseEventHandler;
		handleDelete: React.MouseEventHandler;
	};
};

export function useIllegalDetail(id: string): IllegalDetail {
	const router = useRouter();
	const [initData, setInitData] = useState<IllegalData | null>(null);
	const [formData, setFormData] = useState<UpdateIllegalRequest>(parseIllegalToRequest(initData));
	const [note, setNote] = useState<string>("");
	const [imagePreview, setImagePreview] = useState<string>("");
	const [passportImagePreview, setPassportImagePreview] = useState<string>("");
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [passportFile, setPassportFile] = useState<File | null>(null);
	const [isFound, setIsFound] = useState<boolean | undefined>(undefined);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isSavingNote, setIsSavingNote] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchData = async () => {
		const response = await getIllegalById(id);

		const initData = response.success ? response.data : null;

		setIsFound(response.success);
		setInitData(initData);
		setFormData(parseIllegalToRequest(initData));
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

	const handleSaveNote = async () => {
		setIsSavingNote(true);
		const response = await updateIllegal(id, {
			...parseIllegalToRequest(initData),
			note,
			photo: undefined,
			passport_photo: undefined,
		});
		if (response.success) {
			Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: "บันทึกหมายเหตุระบบเรียบร้อยแล้ว!",
				timer: 1500,
				showConfirmButton: false,
			});
			await fetchData();
		} else {
			Swal.fire({
				icon: "error",
				title: "เกิดข้อผิดพลาด",
				text: `เกิดข้อผิดพลาดในการบันทึกหมายเหตุ: ${response.message}`,
			});
		}
		setIsSavingNote(false);
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

		if (!result.isConfirmed) return;

		const response = await deleteIllegal(id);
		if (response.success) {
			await Swal.fire({
				icon: "success",
				title: "สำเร็จ!",
				text: "ลบข้อมูลออกจากระบบเสร็จสิ้น",
				timer: 1500,
				showConfirmButton: false,
			});
			router.push("/immigrants/illegal");
		} else {
			Swal.fire({
				icon: "error",
				title: "เกิดข้อผิดพลาด",
				text: "เกิดข้อผิดพลาดในการส่งคำสั่งลบข้อมูลไปยังฐานข้อมูล",
			});
		}
		setIsDeleting(false);
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
			isSavingNote,
			isDeleting,
		},
		actions: { fetchData, setFormData, setNote, setIsEditing, setImageFile, setPassportFile },
		handlers: {
			handleInputChange,
			handleCheckboxChange,
			handleSave,
			handleSaveNote,
			handleDelete,
		},
	};
}
