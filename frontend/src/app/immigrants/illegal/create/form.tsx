"use client";

import React from "react";

import CreateForm2, { FormComboboxProps, FormLayout } from "@/components/form/create-form";
import { ALL_NATIONALITIES } from "@/constants/nationalities";
import { useAddressOptions } from "@/hooks/useAddressOptions";
import { CreateIllegalRequest } from "@/lib/schema/illegal";

export default function CreateIllegalPageForm({
	formData,
	setFormData,
	handleInputChange,
}: {
	formData: CreateIllegalRequest;
	setFormData: React.Dispatch<React.SetStateAction<CreateIllegalRequest>>;
	handleInputChange: React.ChangeEventHandler;
}) {
	const { props } = useAddressOptions(
		formData,
		setFormData,
		"detected_location_province",
		"detected_location_district",
		"detected_location_sub_district"
	);

	const nationalityProps: FormComboboxProps<string, typeof formData> = {
		component: "combobox",
		label: "สัญชาติ",
		name: "nationality",
		items: ALL_NATIONALITIES,
		optionsFunc: (nationality) => ({ label: nationality, value: nationality }),
		value: formData["nationality"],
		onValueChange: (v) => setFormData((prev) => ({ ...prev, nationality: v ?? "" })),
	};

	const layout: FormLayout<CreateIllegalRequest> = [
		{
			heading: "ข้อมูลส่วนบุคคลและชื่อ-นามสกุล",
			props: [
				[
					{ component: "input", label: "ชื่อต้นภาษาไทย *", name: "first_name_th", required: true },
					{ component: "input", label: "ชื่อกลางภาษาไทย", name: "middle_name_th" },
					{ component: "input", label: "นามสกุลภาษาไทย *", name: "last_name_th", required: true },
				],
				[
					{ component: "input", label: "ชื่อต้นภาษาอังกฤษ", name: "first_name_en" },
					{ component: "input", label: "ชื่อกลางภาษาอังกฤษ", name: "middle_name_en" },
					{ component: "input", label: "นามสกุลภาษาอังกฤษ", name: "last_name_en" },
				],
				[
					{ component: "input", label: "เลขหนังสือเดินทาง", name: "passport_id" },
					nationalityProps,
					{
						component: "nativeselect",
						label: "เพศ",
						name: "gender",
						options: [
							{ label: "ไม่ระบุ", value: "" },
							{ label: "ชาย", value: "ชาย" },
							{ label: "หญิง", value: "หญิง" },
						],
					},
				],
			],
		},
		{
			heading: "รายละเอียดจุดตรวจเจอและการคัดกรอง",
			props: [
				[
					{
						component: "textarea",
						label: "รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่ ฯลฯ) *",
						name: "detected_location_details",
						required: true,
						rows: 2,
					},
				],
				[props.provinceProps, props.districtProps, props.subDistrictProps],
				[
					{ component: "input", label: "วันที่ตรวจพบ", name: "detected_date", type: "date" },
					{ component: "input", label: "สถานที่ทำงานปลายทาง", name: "workplace" },
				],
				[
					{
						component: "nativeselect",
						label: "เข้าข่ายเป็นผู้เสียหายตกเป็นเหยื่อจากการค้ามนุษย์",
						name: "is_victim",
						options: [
							{ label: "ไม่คัดกรองสถานะ", value: "PENDING" },
							{ label: "เป็นผู้เสียหาย", value: "YES" },
							{ label: "ไม่เป็นผู้เสียหาย", value: "NO" },
						],
					},
				],
				[
					{
						component: "textarea",
						label: "บันทึกรายละเอียดผลการคัดกรอง",
						name: "screening_details",
						rows: 4,
					},
				],
				[
					{
						component: "textarea",
						label: "หมายเหตุเพิ่มเติม (Note)",
						name: "note",
						rows: 3,
					},
				],
			],
		},
	];

	return <CreateForm2 formData={formData} layout={layout} handleInputChange={handleInputChange} />;
}
