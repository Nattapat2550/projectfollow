export type GetRepatriatedByIdResponse = {
  success: boolean;
  data?: RepatriatedData;
  message?: string;
};

export type CreateRepatriatedRequest = {
  [key in keyof RepatriatedData]?: string;
} & {
  age?: string;
  is_victim?: string;
  screening_details?: string;
};
export type CreateRepatriatedResponse = {
  success: boolean;
  data?: RepatriatedData;
  message?: string;
};

export type UpdateRepatriatedRequest = {
  [key in keyof RepatriatedData]?: string;
} & {
  age?: string;
  is_victim?: string;
  screening_details?: string;
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
