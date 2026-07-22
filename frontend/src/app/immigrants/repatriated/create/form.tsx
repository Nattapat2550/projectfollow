"use client";

import React from "react";

import CreateForm, { FieldsLayout } from "@/components/form/create-form";
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
	const { options, states, actions } = useAddressOptions(
		formData,
		setFormData,
		"province",
		"district",
		"sub_district"
	);

	const layout: FieldsLayout<CreateRepatriatedRequest> = [
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
				[
					{ label: "วันเดือนปีเกิด", name: "date_of_birth", props: { type: "date" } },
					{ label: "อายุปัจจุบัน (ปี)", name: "age", props: { type: "number" } },
					{ label: "เลขประจำตัวประชาชน *", name: "national_id", props: { required: true } },
				],
			],
		},
		{
			heading: " รายละเอียดที่อยู่และการทำงาน ",
			inputs: [
				[
					{
						label: "รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่ ฯลฯ) *",
						name: "address_details",
						component: "textarea",
						props: {
							required: true,
							rows: 2,
						},
					},
				],
				[
					{
						label: "จังหวัด",
						name: "province",
						component: "autocomplete",
						options: options.provinces,
						value: states.provinceOption,
						onChange: actions.handleProvinceChange,
					},
					{
						label: "เขต/อำเภอ",
						name: "district",
						component: "autocomplete",
						options: options.districts,
						value: states.districtOption,
						onChange: actions.handleDistrictChange,
					},
					{
						label: "แขวง/ตำบล",
						name: "sub_district",
						component: "autocomplete",
						options: options.subDistricts,
						value: states.subDistrictOption,
						onChange: actions.handleSubDistrictChange,
					},
				],
				[
					{ label: "อาคาร (Building)", name: "building" },
					{ label: "ชั้น (Floor)", name: "floor" },
					{ label: "ห้อง (Room)", name: "room" },
				],
				[
					{ label: "ประเภทงาน (Job Type)", name: "job_type" },
					{ label: "หน้าที่ (Role)", name: "role" },
				],
				[
					{ label: "เงินเดือน (Salary)", name: "salary", props: { type: "number" } },
					{ label: "จ่ายโดย (Paid By)", name: "paid_by" },
					{ label: "วิธีชำระเงิน (Payment Method)", name: "payment_method" },
				],
			],
		},
		{
			heading: "รายละเอียดการส่งตัวและคดีความ",
			inputs: [
				[
					{ label: "วันที่ส่งกลับประเทศ", name: "return_date", props: { type: "date" } },
					{ label: "จำนวนเคสคดี", name: "number_of_case", props: { type: "number" } },
					{ label: "จำนวนหมายจับ", name: "number_of_warrant", props: { type: "number" } },
				],
				[{ label: "หน่วยงานที่รับผิดชอบ", name: "responsible_agency" }],
				[
					{
						label: "สถานะผู้เสียหาย (Victim Status)",
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
						label: "รายละเอียดการคัดกรอง (Screening Details)",
						name: "screening_details",
						component: "textarea",
						props: {
							rows: 3,
						},
					},
				],
				[
					{
						label: "หมายเหตุเพิ่มเติม (Note)",
						name: "note",
						component: "textarea",
						props: {
							rows: 3,
						},
					},
				],
			],
		},
	];

	return <CreateForm formData={formData} layout={layout} handleInputChange={handleInputChange} />;
}
