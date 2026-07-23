interface RepatriatedData {
	id: string;

	first_name_th: string;
	middle_name_th: string | undefined | null;
	last_name_th: string;
	first_name_en: string | undefined | null;
	middle_name_en: string | undefined | null;
	last_name_en: string | undefined | null;
	gender: string;
	date_of_birth: string | undefined | null;
	national_id: string;
	passport_id: string | undefined | null;
	nationality: string | undefined | null;
	photo_url: string | undefined | null;
	passport_photo_url: string | undefined | null;

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

	number_of_case: number;
	number_of_warrant: number;
	is_victim: string;
	responsible_agency: string | undefined | null;

	return_date: string | undefined | null;
	channel: string | undefined | null;
	note: string | undefined | null;
	result: string;
	screening_details: string;

	created_at: string;
	updated_at: string;
	created_by: string;
}
