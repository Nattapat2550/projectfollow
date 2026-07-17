import { initIllegalRequest, initRepatriatedRequest } from "./initRequest";
import { UpdateIllegalRequest } from "./schema/illegal";
import { UpdateRepatriatedRequest } from "./schema/repatriated";

export function parseIllegalToRequest(data: Partial<IllegalData> | null): UpdateIllegalRequest {
	return initIllegalRequest({
		first_name_th: data?.first_name_th,
		middle_name_th: data?.middle_name_th,
		last_name_th: data?.last_name_th,
		first_name_en: data?.first_name_en,
		middle_name_en: data?.middle_name_en,
		last_name_en: data?.last_name_en,
		gender: data?.gender,
		date_of_birth: data?.date_of_birth?.split("T")[0],
		passport_id: data?.passport_id,
		nationality: data?.nationality,
		photo_url: data?.photo_url,

		detected_location_details: data?.detected_location_details,
		detected_location_province: data?.detected_location_province,
		detected_location_district: data?.detected_location_district,
		detected_location_sub_district: data?.detected_location_sub_district,

		detected_date: data?.detected_date?.split("T")[0],
		is_victim: data?.is_victim,
		screening_details: data?.screening_details,
		workplace: data?.workplace,

		note: data?.note,
	});
}

export function parseRepatriatedToRequest(
	data: Partial<RepatriatedData> | null
): UpdateRepatriatedRequest {
	return initRepatriatedRequest({
		first_name_th: data?.first_name_th,
		middle_name_th: data?.middle_name_th,
		last_name_th: data?.last_name_th,
		first_name_en: data?.first_name_en,
		middle_name_en: data?.middle_name_en,
		last_name_en: data?.last_name_en,
		gender: data?.gender,
		date_of_birth: data?.date_of_birth?.split("T")[0],
		national_id: data?.national_id,
		passport_id: data?.passport_id,
		nationality: data?.nationality,
		photo_url: data?.photo_url,

		address_details: data?.address_details,
		sub_district: data?.sub_district,
		district: data?.district,
		province: data?.province,
		building: data?.building,
		floor: data?.floor,
		room: data?.room,
		job_type: data?.job_type,
		role: data?.role,

		salary: data?.salary,
		paid_by: data?.paid_by,
		payment_method: data?.payment_method,

		number_of_case: String(data?.number_of_case || 0),
		number_of_warrant: String(data?.number_of_warrant || 0),
		responsible_agency: data?.responsible_agency,

		return_date: data?.return_date?.split("T")[0],
		note: data?.note ?? "",
		screening_details: data?.screening_details ?? "",
		is_victim: data?.is_victim ?? "",
	});
}
