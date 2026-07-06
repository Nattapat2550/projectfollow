export type GetUploadProgressResponse = {
	current?: number;
	total?: number;
	status?: string;
};
export type UploadExcelRequestQuery = {
	action: string;
	jobId: string;
};
export type UploadExcelResponse = {
	success: true;
	message: string;
	errors?: string[];
	total_rows?: number;
	preview_data?: {
		ลำดับที่อ่านได้: number;
		first_name_th: string;
		last_name_th: string;
		first_name_en: string | null;
		last_name_en: string | null;
		dob: string | undefined;
		gender: string | null;
		nationality: string;
		id_card: string;
		passport: string | null;
		photo_url: string | null;
		address_details: string;
		sub_district: string | null | undefined;
		district: string | null | undefined;
		province: string | null | undefined;
		building: string | null;
		floor: string | null;
		room: string | null;
		job_type: string | null;
		role: string | null;
		salary: string | null;
		paid_by: string | null;
		payment_method: string | null;
		case_id_count: number;
		warrant: number;
		is_victim: string;
		responsible_agency: string | null;
		note: string | null;
		raw_data_from_excel: { [key: string]: string };
	}[];
};
