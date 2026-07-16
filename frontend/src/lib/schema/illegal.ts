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
	| "national_id"
	| "passport_photo_url"
>;

export type IllegalRequestData = Record<keyof IllegalOmited, string> & {
	age?: string;
};

export type GetIllegalByIdResponse = {
	success: true;
	data: IllegalData;
};

export type CreateIllegalRequest = IllegalRequestData;
export type CreateIllegalRequestFile = Record<"photo" | "passport_photo", File | undefined | null>;
export type CreateIllegalResponse = {
	success: boolean;
	data?: IllegalData;
	message?: string;
};

export type UpdateIllegalRequest = IllegalRequestData;
export type UpdateIllegalRequestFile = Record<"photo" | "passport_photo", File | undefined | null>;
export type UpdateIllegalResponse = {
	success: boolean;
	data?: IllegalData;
	message?: string;
};

export type DeleteIllegalResponse = {
	success: true;
	message: string;
};
