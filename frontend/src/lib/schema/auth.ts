export type RegisterRequest = {
  name: string;
  password: string;
  role: string;
  color: string;
};
export type RegisterResponse = {
  success: true;
  token: string;
  user: User;
};

export type LoginRequest = {
  name: string;
  password: string;
};
export type LoginResponse = {
  success: true;
  token: string;
  user: User;
};

export type LogoutResponse = { success: true };

export type GetMeResponse = { success: true; data: User };

export type UpdateProfileRequest = { name: string; color: string };
export type UpdateProfileResponse = { success: true; data: User };

export type UpdatePassswordRequest = { password: string };
export type UpdatePasswordResponse = { success: true; msg: string };
