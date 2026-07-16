import { clearClientAuthData, getClientAuthData, setClientAuthData } from "../client/auth";
import * as schema from "../schema/auth";
import { fetchWrapper, withAuthHeader, withJSONBody } from "../utils";

export async function login(
	req: schema.LoginRequest
): Promise<schema.LoginResponse | ErrorResponse> {
	const response = await fetchWrapper<schema.LoginResponse>(
		`/api/v1/auth/login`,
		withJSONBody(req, "POST")
	);
	if (response.success) setClientAuthData(response.token, response.user);

	return response;
}

export async function logout(): Promise<schema.LogoutResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	const response = await fetchWrapper<schema.LogoutResponse>(
		`/api/v1/auth/logout`,
		withAuthHeader(token, { credentials: "include" })
	);

	clearClientAuthData();

	return response;
}

export async function getMe(): Promise<schema.GetMeResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(`/api/v1/auth/me`, withAuthHeader(token, { credentials: "include" }));
}

export async function updateProfile(
	req: schema.UpdateProfileRequest
): Promise<schema.UpdateProfileResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(`/api/v1/auth/profile`, withJSONBody(req, "PUT", withAuthHeader(token)));
}

export async function updatePassword(
	req: schema.UpdatePassswordRequest
): Promise<schema.UpdatePasswordResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(`/api/v1/auth/password`, withJSONBody(req, "PUT", withAuthHeader(token)));
}
