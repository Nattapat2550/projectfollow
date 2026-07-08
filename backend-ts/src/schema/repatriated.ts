export type GetRepatriatedByIdResponse = {
	success: boolean;
	data?: RepatriatedData;
	message?: string;
};

export type CreateRepatriatedRequest = {
	first_name_th: string;
	middle_name_th: string | undefined | null;
	last_name_th: string;
	first_name_en: string | undefined | null;
	middle_name_en: string | undefined | null;
	last_name_en: string | undefined | null;
	national_id: string;
	passport_id: string | undefined | null;
	date_of_birth: string | undefined | null;
	age: string | undefined | null;
	nationality: string;
	gender: string;
	return_date: string | undefined | null;
	number_of_case: string;
	number_of_warrant: string;
	channel: string | undefined | null;
	address_details: string;
	sub_district: string;
	district: string;
	province: string;
	building: string;
	floor: string | undefined | null;
	room: string | undefined | null;
	job_type: string;
	role: string;
	salary: string;
	paid_by: string;
	payment_method: string;
	responsible_agency: string | undefined | null;
	is_victim: string;
	screening_details: string;
	note: string;
};
export type CreateRepatriatedResponse = {
	success: boolean;
	data?: RepatriatedData;
	message?: string;
};

export type UpdateRepatriatedRequest = {
	first_name_th: string;
	middle_name_th: string | undefined | null;
	last_name_th: string;
	first_name_en: string | undefined | null;
	middle_name_en: string | undefined | null;
	last_name_en: string | undefined | null;
	national_id: string;
	passport_id: string | undefined | null;
	date_of_birth: string | undefined | null;
	age: string | undefined | null;
	nationality: string;
	gender: string;
	return_date: string | undefined | null;
	number_of_case: string;
	number_of_warrant: string;
	channel: string | undefined | null;
	address_details: string;
	sub_district: string;
	district: string;
	province: string;
	building: string;
	floor: string | undefined | null;
	room: string | undefined | null;
	job_type: string;
	role: string;
	salary: string;
	paid_by: string;
	payment_method: string;
	responsible_agency: string | undefined | null;
	is_victim: string;
	screening_details: string;
	note: string;
};
export type UpdateRepatriatedResponse = {
	success: boolean;
	data?: RepatriatedData;
	message?: string;
};

export type DeleteRepatriatedResponse = {
	success: true;
	message: string;
};
