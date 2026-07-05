export type GetAllDataRequestQuery = {
	page: string;
	limit: string;
};
// TODO: cleanup response with frontend
export type GetAllDataResponse = {
	success: true;
	data: {
		immigrants: IllegalData[];
		illegals: IllegalData[];
		repatriateds: RepatriatedData[];
		meta: {
			immigrantsTotal: number;
			illegalsTotal: number;
			repatriatedsTotal: number;
			currentPage: number;
			limit: number;
		};
	};
};
export type GetDashboardDataRequestQuery = {
	type: string;
	page: string;
	limit: string;
};
export type GetDashboardDataResponse = {
	success: true;
	tableData: IllegalData[] | RepatriatedData[];
	meta: {
		totalItems: number;
		totalPages: number;
		currentPage: number;
		limit: number;
	};
};
