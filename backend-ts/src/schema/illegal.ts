export type GetIllegalByIdResponse = {
	success: boolean;
	data?: IllegalData;
	message?: string;
};

export type CreateIllegalRequest = {
	first_name_th: string;
	middle_name_th: string | undefined | null;
	last_name_th: string;
	first_name_en: string | undefined | null;
	middle_name_en: string | undefined | null;
	last_name_en: string | undefined | null;
	gender: string;
	date_of_birth: string | undefined | null;
	passport_id: string | undefined | null;
	age: string | undefined | null;
	nationality: string;
	detected_location_details: string;
	detected_location_sub_district: string;
	detected_location_district: string;
	detected_location_province: string;
	workplace: string;
	screening_details: string;
	is_victim: string;
	detected_date: string;
	note: string;
};
export type CreateIllegalFileRequest = {
	[fieldname: string]: Express.Multer.File[];
};
export type CreateIllegalResponse = {
	success: boolean;
	data?: IllegalData;
	message?: string;
};

export type UpdateIllegalRequest = {
	first_name_th: string;
	middle_name_th: string | undefined | null;
	last_name_th: string;
	first_name_en: string | undefined | null;
	middle_name_en: string | undefined | null;
	last_name_en: string | undefined | null;
	gender: string;
	date_of_birth: string | undefined | null;
	passport_id: string | undefined | null;
	age: string | undefined | null;
	nationality: string;
	detected_location_details: string;
	detected_location_sub_district: string;
	detected_location_district: string;
	detected_location_province: string;
	workplace: string;
	screening_details: string;
	is_victim: string;
	detected_date: string;
	note: string;
};
export type UpdateIllegalResponse = {
	success: boolean;
	data?: IllegalData;
	message?: string;
};

export type DeleteIllegalResponse = {
	success: true;
	message: string;
};

export type GetIllegalUploadProgressResponse = {
	current?: number;
	total?: number;
	successCount?: number;
	failedCount?: number;
	status?: string;
};

export type UploadExcelIllegalRequestQuery = {
	action: string;
	jobId: string;
};
export type UploadExcellIllegalResponse = {
	success: true;
	message: string;
	errors?: string[];
	total_rows?: number;
	preview_data?: {
		ลำดับที่อ่านได้: number;
		first_name_th: string;
		middle_name_th: string | null;
		last_name_th: string;
		first_name_en: string | null;
		middle_name_en: string | null;
		last_name_en: string | null;
		nationality: string | undefined | null;
		passport_id: string | null;
		date_of_birth: string | null | undefined;
		detected_location_details: string;
		detected_location_sub_district: string | null | undefined;
		detected_location_district: string | null | undefined;
		detected_location_province: string | null | undefined;
		workplace: string | null;
		gender: string | null;
		detected_date: string | null | undefined;
		is_victim: string;
		screening_details: string;
		raw_data_from_excel: unknown;
	}[];
};
