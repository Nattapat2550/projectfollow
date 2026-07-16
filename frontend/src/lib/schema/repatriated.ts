type RepatriatedOmited = Omit<
	RepatriatedData,
	| "id"
	| "channel"
	| "created_by"
	| "created_at"
	| "updated_at"
	| "result"
	| "victim_indicator"
	| "passport_photo_url"
>;

export type RepatriatedRequestData = Record<keyof RepatriatedOmited, string> & {
	age?: string;
	is_victim?: string;
	screening_details?: string;
};
export type GetRepatriatedByIdResponse = {
	success: true;
	data: RepatriatedData;
};

export type CreateRepatriatedRequest = RepatriatedRequestData;
export type CreateRepatriatedRequestFile = Record<
	"photo" | "passport_photo",
	File | undefined | null
>;
export type CreateRepatriatedResponse = {
	success: boolean;
	data?: RepatriatedData;
	message?: string;
};

export type UpdateRepatriatedRequest = RepatriatedRequestData;
export type UpdateRepatriatedRequestFile = Record<
	"photo" | "passport_photo",
	File | undefined | null
>;
export type UpdateRepatriatedResponse = {
	success: boolean;
	data?: RepatriatedData;
	message?: string;
};

export type DeleteRepatriatedResponse = {
	success: true;
	message: string;
};
