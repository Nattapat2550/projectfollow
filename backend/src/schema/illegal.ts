// TODO
type IllegalOmited = Omit<
  IllegalData,
  | "id"
  | "channel"
  | "created_by"
  | "created_at"
  | "updated_at"
  | "result"
  | "victim_indicator"
  | "passport_photo_url"
>;

export type IllegalRequestData = Record<keyof IllegalOmited, string>;

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
export type CreateIllegalRequestFile = Record<
  "photo" | "passport_photo",
  File | undefined | null
>;
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
export type UpdateIllegalRequestFile = Record<
  "photo" | "passport_photo",
  File | undefined | null
>;
export type UpdateIllegalResponse = {
  success: boolean;
  data?: IllegalData;
  message?: string;
};

export type DeleteIllegalResponse = {
  success: true;
  message: string;
};
