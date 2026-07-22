"use client";

import React from "react";

import CreateForm, { FieldsLayout } from "@/components/form/create-form";
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
	const { options, states, actions } = useAddressOptions(
		formData,
		setFormData,
		"detected_location_province",
		"detected_location_district",
		"detected_location_sub_district"
	);

	const layout: FieldsLayout<CreateIllegalRequest> = [
		{
			heading: "ข้อมูลส่วนบุคคลและชื่อ-นามสกุล",
			inputs: [
				[
					{ label: "ชื่อต้นภาษาไทย *", name: "first_name_th", props: { required: true } },
					{ label: "ชื่อกลางภาษาไทย", name: "middle_name_th" },
					{ label: "นามสกุลภาษาไทย *", name: "last_name_th", props: { required: true } },
				],
				[
					{ label: "ชื่อต้นภาษาอังกฤษ", name: "first_name_en" },
					{ label: "ชื่อกลางภาษาอังกฤษ", name: "middle_name_en" },
					{ label: "นามสกุลภาษาอังกฤษ", name: "last_name_en" },
				],
				[
					{ label: "เลขหนังสือเดินทาง", name: "passport_id" },
					{
						label: "สัญชาติ",
						name: "nationality",
						component: "autocomplete",
						options: ALL_NATIONALITIES,
						value: formData["nationality"],
						onChange: (v: string) => setFormData((prev) => ({ ...prev, nationality: v ?? "" })),
					},
					{
						label: "เพศ",
						name: "gender",
						component: "select",
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
			inputs: [
				[
					{
						label: "รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่ ฯลฯ) *",
						name: "detected_location_details",
						component: "textarea",
						props: { required: true, rows: 2 },
					},
				],
				[
					{
						label: "จังหวัด",
						name: "detected_location_province",
						component: "autocomplete",
						options: options.provinces,
						value: states.provinceOption,
						onChange: actions.handleProvinceChange,
					},
					{
						label: "เขต/อำเภอ",
						name: "detected_location_district",
						component: "autocomplete",
						options: options.districts,
						value: states.districtOption,
						onChange: actions.handleDistrictChange,
						// props: { disabled: formData["detected_location_province"] == "" },
					},
					{
						label: "แขวง/ตำบล",
						name: "detected_location_sub_district",
						component: "autocomplete",
						options: options.subDistricts,
						value: states.subDistrictOption,
						onChange: actions.handleSubDistrictChange,
						props: { disabled: formData["detected_location_district"] == "" },
					},
				],
				[
					{ label: "วันที่ตรวจพบ", name: "detected_date", props: { type: "date" } },
					{ label: "สถานที่ทำงานปลายทาง", name: "workplace" },
				],
				[
					{
						label: "เข้าข่ายเป็นผู้เสียหายตกเป็นเหยื่อจากการค้ามนุษย์",
						name: "is_victim",
						component: "select",
						options: [
							{ label: "ไม่คัดกรองสถานะ", value: "PENDING" },
							{ label: "เป็นผู้เสียหาย", value: "YES" },
							{ label: "ไม่เป็นผู้เสียหาย", value: "NO" },
						],
					},
				],
				[
					{
						label: "บันทึกรายละเอียดผลการคัดกรอง",
						name: "screening_details",
						component: "textarea",
						props: {
							rows: 4,
						},
					},
				],
				[
					{
						label: "หมายเหตุเพิ่มเติม (Note)",
						name: "note",
						component: "textarea",
						props: { rows: 3 },
					},
				],
			],
		},
	];

	return <CreateForm formData={formData} layout={layout} handleInputChange={handleInputChange} />;
}
