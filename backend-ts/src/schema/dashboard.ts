export type GetDashboardStatsRequestQuery = {
	type: string;
	nationality: string;
	province: string;
	gender: string;
	startDate: string;
	endDate: string;
	dobStart: string;
	dobEnd: string;
	isVictim: string;
	hasPassport: string;
	creator: string;
	ageGroup: string;
	page: string;
	limit: string;
	sortBy: string;
	sortOrder: string;
};

export type DashboardStatsInfo = {
	total?: number;
	victims?: number;
	hasPassport?: number;
};

export type DashboardStatsChartInfo = {
	gender?: {
		name: string;
		value: number;
	}[];
	province?: {
		name: string;
		value: number;
	}[];
	channel?: {
		name: string;
		value: number;
	}[];
	creator?: {
		name: string;
		value: number;
		color: string;
	}[];
	nationality?: {
		name: string;
		value: number;
	}[];
	victim?: {
		name: string;
		value: number;
	}[];
	passport?: {
		name: string;
		value: number;
	}[];
	dateTrend?: {
		name: string;
		value: number;
	}[];
	ageGroup?: {
		name: string;
		value: number;
	}[];
};

export type GetDashboardStatsResponse = {
	success: true;
	meta: {
		totalItems: number;
		totalPages: number;
		currentPage: number;
		allNationalities: string[];
		allProvinces: string[];
		allGenders: string[];
		allCreators: string[];
	};
	stats: DashboardStatsInfo;
	charts: DashboardStatsChartInfo;
	tableData: IllegalData[] | RepatriatedData[];
};
