"use client";

import React, { ChangeEventHandler } from "react";

import AutocompleteInput, { AutocompleteInputProps } from "@/components/ui/AutocompleteInput";
import { ALL_NATIONALITIES } from "@/constants/nationalities";
import { useAddressOptions } from "@/hooks/useAddressOptions";
import { CreateRepatriatedRequest } from "@/lib/schema/repatriated";
import { cn } from "@/lib/utils";

const inputClass =
	"w-full border px-3 py-1.5 text-sm rounded-sm bg-background !text-black dark:!text-white border-(--wrapper) focus:outline-none transition-all dark:[color-scheme:dark]";
const labelClass = "block text-xs font-semibold mb-1.5 !text-black dark:!text-white opacity-80";

type CustomField = {
	label: string;
	input: React.ReactElement;
};
type PreBuiltField = {
	label: string;
	input?: undefined;
	name: keyof CreateRepatriatedRequest;
} & (InputField | TextAreaField | SelectField | AutocompleteField);

type InputField = {
	component?: undefined;
} & Omit<React.ComponentProps<"input">, "name">;

type TextAreaField = {
	component: "textarea";
} & Omit<React.ComponentProps<"textarea">, "name">;

type SelectField = {
	component: "select";
	options: ({ label: string } & React.ComponentProps<"option">)[];
} & Omit<React.ComponentProps<"select">, "name">;

type AutocompleteField = {
	component: "autocomplete";
} & Omit<AutocompleteInputProps, "value" | "onChange">;

export default function CreateRepatriatedPageForm({
	formData,
	setFormData,
	handleInputChange,
}: {
	formData: CreateRepatriatedRequest;
	setFormData: React.Dispatch<React.SetStateAction<CreateRepatriatedRequest>>;
	handleInputChange: React.ChangeEventHandler;
}) {
	const { provinces, districtOptions, subDistrictOptions } = useAddressOptions(
		formData.province,
		formData.district
	);

	const handleSelectDistrict = (opt: any) => {
		const { district, province } = opt.extra;
		setFormData((prev) => ({
			...prev,
			district,
			province,
		}));
	};

	const handleSelectSubDistrict = (opt: any) => {
		const { subDistrict, district, province } = opt.extra;
		setFormData((prev) => ({
			...prev,
			sub_district: subDistrict,
			district,
			province,
		}));
	};

	const layout: {
		heading: string;
		inputs: (CustomField | PreBuiltField)[][];
	}[] = [
		{
			heading: "ข้อมูลส่วนบุคคลและชื่อ-นามสกุล",
			inputs: [
				[
					{ label: "ชื่อต้นภาษาไทย *", name: "first_name_th", required: true },
					{ label: "ชื่อกลางภาษาไทย", name: "middle_name_th" },
					{ label: "นามสกุลภาษาไทย *", name: "last_name_th", required: true },
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
					{ label: "วันเดือนปีเกิด", name: "date_of_birth", type: "date" },
					{ label: "อายุปัจจุบัน (ปี)", name: "age", type: "number" },
					{ label: "เลขประจำตัวประชาชน *", name: "national_id", required: true },
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
						required: true,
						rows: 2,
					},
				],
				[
					{
						label: "จังหวัด",
						name: "province",
						component: "autocomplete",
						options: provinces,
					},
					{
						label: "เขต/อำเภอ",
						name: "district",
						component: "autocomplete",
						options: districtOptions,
						onSelectOption: handleSelectDistrict,
					},
					{
						label: "แขวง/ตำบล",
						name: "sub_district",
						component: "autocomplete",
						options: subDistrictOptions,
						onSelectOption: handleSelectSubDistrict,
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
					{ label: "เงินเดือน (Salary)", name: "salary", type: "number" },
					{ label: "จ่ายโดย (Paid By)", name: "paid_by" },
					{ label: "วิธีชำระเงิน (Payment Method)", name: "payment_method" },
				],
			],
		},
		{
			heading: "รายละเอียดการส่งตัวและคดีความ",
			inputs: [
				[
					{ label: "วันที่ส่งกลับประเทศ", name: "return_date", type: "date" },
					{ label: "จำนวนเคสคดี", name: "number_of_case", type: "number" },
					{ label: "จำนวนหมายจับ", name: "number_of_warrant", type: "number" },
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
						rows: 3,
					},
				],
				[
					{
						label: "หมายเหตุเพิ่มเติม (Note)",
						name: "note",
						component: "textarea",
						rows: 3,
					},
				],
			],
		},
	];

	return layout.map((e) => (
		<React.Fragment key={e.heading}>
			<h3 className="mt-8 mb-4 text-xl font-bold text-(--header)">{e.heading}</h3>
			{e.inputs.map((g, idx) => (
				<div
					className={cn("mb-5", g.length > 1 && `grid grid-cols-1 gap-5 md:grid-cols-${g.length}`)}
					key={idx}
				>
					{g.map((i, idx) => (
						<div key={idx}>
							<label className={labelClass}>{i.label}</label>
							{i.input ?? (
								<PrebuiltField
									{...{
										...i,
										value: formData[i.name] ?? "",
										onChange: handleInputChange,
										className: inputClass,
									}}
								/>
							)}
						</div>
					))}
				</div>
			))}
		</React.Fragment>
	));
}

function PrebuiltField(props: PreBuiltField & { value: string; onChange: ChangeEventHandler }) {
	switch (props.component) {
		default:
			return <input {...props} type={props.type ?? "text"} />;
		case "textarea":
			return <textarea {...props} />;
		case "select":
			return (
				<select {...props}>
					{props.options.map((o, idx) => (
						<option {...o} key={idx}>
							{o.label}
						</option>
					))}
				</select>
			);
		case "autocomplete":
			return <AutocompleteInput {...props} />;
	}
}
