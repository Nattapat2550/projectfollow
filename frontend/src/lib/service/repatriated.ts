import { getClientAuthData } from "../client/auth";
import * as schema from "../schema/repatriated";
import { fetchWrapper, withAuthHeader, withFormDataBody } from "../utils";

export async function getRepatriatedById(
	id: string
): Promise<schema.GetRepatriatedByIdResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(`/api/v1/immigrants/repatriated/${id}`, withAuthHeader(token));
}

export async function createRepatriated(
	req: schema.CreateRepatriatedRequest & schema.CreateRepatriatedRequestFile
): Promise<schema.CreateRepatriatedResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(
		`/api/v1/immigrants/repatriated`,
		withFormDataBody(req, "POST", withAuthHeader(token))
	);
}

export async function updateRepatriated(
	id: string,
	req: Partial<schema.UpdateRepatriatedRequest> & schema.UpdateRepatriatedRequestFile
): Promise<schema.UpdateRepatriatedResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(
		`/api/v1/immigrants/repatriated/${id}`,
		withFormDataBody(req, "PUT", withAuthHeader(token))
	);
}

export async function deleteRepatriated(
	id: string
): Promise<schema.DeleteRepatriatedResponse | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(
		`/api/v1/immigrants/repatriated/${id}`,
		withAuthHeader(token, { method: "DELETE" })
	);
}
