import { getClientAuthData } from "../client/auth";
import * as schema from "../schema/dashboard";
import { fetchWrapper, withAuthHeader } from "../utils";

export async function getIllegalDashboardStats(
	query: schema.GetDashboardStatsRequestQuery
): Promise<schema.GetDashboardStatsResponse<"illegal"> | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(`/api/v1/dashboard/illegal`, withAuthHeader(token), query);
}

export async function getRepatriatedDashboardStats(
	query: schema.GetDashboardStatsRequestQuery
): Promise<schema.GetDashboardStatsResponse<"repatriated"> | ErrorResponse> {
	const { token } = getClientAuthData();
	if (!token) return { success: false, message: "token missing" };

	return fetchWrapper(`/api/v1/dashboard/repatriated`, withAuthHeader(token), query);
}
