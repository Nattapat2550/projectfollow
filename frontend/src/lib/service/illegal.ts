import { getClientAuthData } from "../client/auth";
import * as schema from "../schema/illegal";
import { fetchWrapper, withAuthHeader, withFormDataBody } from "../utils";

export async function getIllegalById(
	id: string
): Promise<schema.GetIllegalByIdResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(
		`/api/v1/immigrants/illegal/${id}`,
		withAuthHeader(token)
	);
}

export async function createIllegal(
	req: schema.CreateIllegalRequest & schema.CreateIllegalRequestFile
): Promise<schema.CreateIllegalResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(
		`/api/v1/immigrants/illegal`,
		withFormDataBody(req, "POST", withAuthHeader(token))
	);
}

export async function updateIllegal(
	id: string,
	req: schema.UpdateIllegalRequest
): Promise<schema.UpdateIllegalResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(
		`/api/v1/immigrants/illegal/${id}`,
		withFormDataBody(req, "PUT", withAuthHeader(token))
	);
}

export async function deleteIllegal(
	id: string
): Promise<schema.DeleteIllegalResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(
		`/api/v1/immigrants/illegal/${id}`,
		withAuthHeader(token, { method: "DELETE" })
	);
}
