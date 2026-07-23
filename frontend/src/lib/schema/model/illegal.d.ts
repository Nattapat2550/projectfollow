interface IllegalData {
	id: string;

	first_name_th: string;
	middle_name_th: string | undefined | null;
	last_name_th: string;
	first_name_en: string | undefined | null;
	middle_name_en: string | undefined | null;
	last_name_en: string | undefined | null;
	gender: string;
	date_of_birth: string | undefined | null;
	national_id: string | undefined | null;
	passport_id: string | undefined | null;
	nationality: string;
	photo_url: string | undefined | null;
	passport_photo_url: string | undefined | null;

	detected_location_details: string;
	detected_location_sub_district: string;
	detected_location_district: string;
	detected_location_province: string;
	is_victim: string;
	detected_date: string;
	workplace: string;
	screening_details: string;
	note: string;

	created_at: string;
	updated_at: string;
	created_by: string;
}
