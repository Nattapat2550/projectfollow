"use client";

import React from "react";

import CreateForm2, { FormComboboxProps, FormLayout } from "@/components/form/create-form";
import { ALL_NATIONALITIES } from "@/constants/nationalities";
import { useAddressOptions } from "@/hooks/useAddressOptions";
import { CreateRepatriatedRequest } from "@/lib/schema/repatriated";

export default function CreateRepatriatedPageForm({
	formData,
	setFormData,
	handleInputChange,
}: {
	formData: CreateRepatriatedRequest;
	setFormData: React.Dispatch<React.SetStateAction<CreateRepatriatedRequest>>;
	handleInputChange: React.ChangeEventHandler;
}) {
	const { props } = useAddressOptions(
		formData,
		setFormData,
		"province",
		"district",
		"sub_district"
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

	const layout: FormLayout<CreateRepatriatedRequest> = [
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
				[
					{ component: "input", label: "วันเดือนปีเกิด", name: "date_of_birth", type: "date" },
					{ component: "input", label: "อายุปัจจุบัน (ปี)", name: "age", type: "number" },
					{
						component: "input",
						label: "เลขประจำตัวประชาชน *",
						name: "national_id",
						required: true,
					},
				],
			],
		},
		{
			heading: " รายละเอียดที่อยู่และการทำงาน ",
			props: [
				[
					{
						component: "textarea",
						label: "รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่ ฯลฯ) *",
						name: "address_details",
						required: true,
						rows: 2,
					},
				],
				[props.provinceProps, props.districtProps, props.subDistrictProps],
				[
					{ component: "input", label: "อาคาร (Building)", name: "building" },
					{ component: "input", label: "ชั้น (Floor)", name: "floor" },
					{ component: "input", label: "ห้อง (Room)", name: "room" },
				],
				[
					{ component: "input", label: "ประเภทงาน (Job Type)", name: "job_type" },
					{ component: "input", label: "หน้าที่ (Role)", name: "role" },
				],
				[
					{ component: "input", label: "เงินเดือน (Salary)", name: "salary", type: "number" },
					{ component: "input", label: "จ่ายโดย (Paid By)", name: "paid_by" },
					{ component: "input", label: "วิธีชำระเงิน (Payment Method)", name: "payment_method" },
				],
			],
		},
		{
			heading: "รายละเอียดการส่งตัวและคดีความ",
			props: [
				[
					{ component: "input", label: "วันที่ส่งกลับประเทศ", name: "return_date", type: "date" },
					{ component: "input", label: "จำนวนเคสคดี", name: "number_of_case", type: "number" },
					{ component: "input", label: "จำนวนหมายจับ", name: "number_of_warrant", type: "number" },
				],
				[{ component: "input", label: "หน่วยงานที่รับผิดชอบ", name: "responsible_agency" }],
				[
					{
						component: "nativeselect",
						label: "สถานะผู้เสียหาย (Victim Status)",
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
						label: "รายละเอียดการคัดกรอง (Screening Details)",
						name: "screening_details",
						rows: 3,
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
