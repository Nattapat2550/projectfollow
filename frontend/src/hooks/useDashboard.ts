import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { GetDashboardStatsRequestQuery, GetDashboardStatsResponse } from "@/lib/schema/dashboard";
import { getIllegalDashboardStats, getRepatriatedDashboardStats } from "@/lib/service/dashboard";

const CHART_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--chart-6)",
];

// FIX
const dashboardFetchCache = new Map<string, GetDashboardStatsResponse<"illegal" | "repatriated">>();

export function useDashboard() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const typeParam = (searchParams.get("type") as "illegal" | "repatriated") || "repatriated";

	const [dashboardData, setDashboardData] = useState<GetDashboardStatsResponse<
		"illegal" | "repatriated"
	> | null>(null);
	const [loading, setLoading] = useState(true);
	const [isUpdating, setIsUpdating] = useState(false);

	const [filterType, setFilterType] = useState<"illegal" | "repatriated">(typeParam);
	const [filterNat, setFilterNat] = useState<string>("ทั้งหมด");
	const [filterGender, setFilterGender] = useState<string>("ทั้งหมด");
	const [filterVictim, setFilterVictim] = useState<string>("ทั้งหมด");
	const [filterPassport, setFilterPassport] = useState<string>("ทั้งหมด");
	const [filterCreator, setFilterCreator] = useState<string>("ทั้งหมด");
	const [filterProvince, setFilterProvince] = useState<string>("ทั้งหมด");
	const [filterRegion, setFilterRegion] = useState<string>("ทั้งหมด");
	const [filterAge, setFilterAge] = useState<string>("ทั้งหมด");

	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");
	const [dobStart, setDobStart] = useState<string>("");
	const [dobEnd, setDobEnd] = useState<string>("");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortField, setSortField] = useState<string>("");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	useEffect(() => {
		const query: GetDashboardStatsRequestQuery = {
			nationality: filterNat,
			gender: filterGender,
			startDate,
			endDate,
			isVictim: filterType === "illegal" ? filterVictim : "ทั้งหมด",
			hasPassport: filterType === "illegal" ? filterPassport : "ทั้งหมด",
			province: filterProvince,
			region: filterRegion,
			ageGroup: filterAge,
			page: currentPage.toString(),
			limit: "50",
			creator: filterCreator,
			sortOrder: sortDirection,
			sortBy: sortField,
		};

		if (filterType == "repatriated") {
			query.dobStart = dobStart;
			query.dobEnd = dobEnd;
		}

		const cacheKey = JSON.stringify(query);

		if (dashboardFetchCache.has(cacheKey)) {
			setDashboardData(dashboardFetchCache.get(cacheKey)!);
			setLoading(false);
			setIsUpdating(false);
		} else {
			if (!dashboardData) setLoading(true);
			else setIsUpdating(true);

			const fetch =
				filterType == "illegal" ?
					getIllegalDashboardStats(query)
				:	getRepatriatedDashboardStats(query);

			fetch.then((response) => {
				if (response.success) {
					dashboardFetchCache.set(cacheKey, response);
					setDashboardData(response);
				}
				setLoading(false);
				setIsUpdating(false);
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		filterType,
		filterNat,
		filterGender,
		filterVictim,
		filterPassport,
		filterCreator,
		filterProvince,
		filterRegion,
		filterAge,
		startDate,
		endDate,
		dobStart,
		dobEnd,
		currentPage,
		sortField,
		sortDirection,
	]);

	useEffect(() => {
		if (typeParam !== filterType) {
			setFilterType(typeParam);
			setCurrentPage(1);
			setSortField("");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [typeParam]);

	const handleFilterChange = (setter: Function, value: any) => {
		setter(value);
		setCurrentPage(1);
	};
	const handleSort = (field: string) => {
		if (sortField === field) setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		else {
			setSortField(field);
			setSortDirection("asc");
		}
		setCurrentPage(1);
	};
	const resetFilters = () => {
		setFilterNat("ทั้งหมด");
		setFilterGender("ทั้งหมด");
		setFilterVictim("ทั้งหมด");
		setFilterPassport("ทั้งหมด");
		setFilterCreator("ทั้งหมด");
		setFilterProvince("ทั้งหมด");
		setFilterRegion("ทั้งหมด");
		setFilterAge("ทั้งหมด");
		setStartDate("");
		setEndDate("");
		setDobStart("");
		setDobEnd("");
		setSortField("");
		setCurrentPage(1);
	};
	const handleTypeChange = (val: "illegal" | "repatriated") => {
		setFilterType(val);
		resetFilters();
		router.replace(`/dashboard?type=${val}`, { scroll: false });
	};

	const nationalitiesOptions = dashboardData?.meta?.allNationalities || ["ทั้งหมด"];
	// เพิ่มการรับประกันว่า "ไม่ระบุ" จะถูกรวมใน dropdown เสมอ
	const gendersOptions = Array.from(
		new Set(["ทั้งหมด", "ชาย", "หญิง", "ไม่ระบุ", ...(dashboardData?.meta?.allGenders || [])])
	);
	const creatorsOptions = dashboardData?.meta?.allCreators || ["ทั้งหมด"];
	const provincesOptions = Array.from(
		new Set(["ทั้งหมด", "ไม่ระบุ", ...(dashboardData?.meta?.allProvinces || [])])
	);
	const regionsOptions = Array.from(
		new Set(["ทั้งหมด", "ไม่ระบุ", ...(dashboardData?.meta?.allRegions || [])])
	);
	const ageOptions = ["ทั้งหมด", "0-18 ปี", "19-30 ปี", "31-50 ปี", "51 ปีขึ้นไป", "ไม่ระบุ"];

	const tableRows = (dashboardData?.tableData || []).map((item: any) => {
		const fnTh =
			!item.first_name_th || item.first_name_th.trim() === "" || item.first_name_th === "ไม่ระบุ" ?
				item.first_name_en || "ไม่ระบุ"
			:	item.first_name_th;
		const lnTh =
			!item.last_name_th || item.last_name_th.trim() === "" || item.last_name_th === "ไม่ระบุ" ?
				item.last_name_en || "ไม่ระบุ"
			:	item.last_name_th;
		return { ...item, first_name_th: fnTh, last_name_th: lnTh };
	});

	const stats: { label: string; value: number }[] = (() => {
		if (!dashboardData) return [];
		return filterType === "illegal" ?
				[
					{
						label: "จำนวนทั้งหมดที่พบตามตัวกรอง",
						value: dashboardData.stats.total,
					},
					{
						label: "เป็นผู้เสียหาย (ค้ามนุษย์)",
						value: dashboardData.stats.victims || 0,
					},
					{
						label: "ผู้มีหนังสือเดินทาง",
						value: dashboardData.stats.hasPassport || 0,
					},
				]
			:	[
					{
						label: "จำนวนทั้งหมดที่พบตามตัวกรอง",
						value: dashboardData.stats.total,
					},
					{ label: "เป็นผู้เสียหาย", value: dashboardData.stats.victims || 0 },
				];
	})();

	const formatStandardChartData = (raw: any[] = [], total: number = 0, colorOffset: number = 0) => {
		const sum = raw.reduce((acc, curr) => acc + curr.value, 0);
		const mapped = raw.map((d, i) => ({
			...d,
			color: CHART_COLORS[(i + colorOffset) % CHART_COLORS.length],
		}));
		if (total > sum)
			mapped.push({
				name: "อื่นๆ",
				value: total - sum,
				color: "var(--chart-other)",
			});
		return mapped;
	};

	const formatCreatorChartData = (raw: any[] = [], total: number = 0) => {
		const sum = raw.reduce((acc, curr) => acc + curr.value, 0);
		const mapped = raw.map((d, i) => ({
			...d,
			color:
				d.color
				|| d.profile_color
				|| d.creator_color
				|| CHART_COLORS[(i + 4) % CHART_COLORS.length],
		}));
		if (total > sum)
			mapped.push({
				name: "อื่นๆ",
				value: total - sum,
				color: "var(--chart-other)",
			});
		return mapped;
	};

	const natChart = formatStandardChartData(
		dashboardData?.charts?.nationality,
		dashboardData?.stats?.total,
		0
	);
	const provinceChart = formatStandardChartData(
		dashboardData?.charts?.province,
		dashboardData?.stats?.total,
		4
	);
	const regionChart = formatStandardChartData(
		dashboardData?.charts?.region,
		dashboardData?.stats?.total,
		5
	);

	// กราฟเพศใหม่
	const genderChart = formatStandardChartData(
		dashboardData?.charts?.gender,
		dashboardData?.stats?.total,
		2
	);
	const victimChart = formatStandardChartData(
		dashboardData?.charts?.victim,
		dashboardData?.stats?.total,
		3
	);

	const passportChart = (dashboardData?.charts?.passport || []).map((d) => ({
		...d,
		color: d.name === "มีหนังสือเดินทาง" ? "var(--chart-2)" : "var(--chart-4)",
	}));

	const creatorChart = formatCreatorChartData(
		dashboardData?.charts?.creator,
		dashboardData?.stats?.total
	);
	const ageChart = formatStandardChartData(
		dashboardData?.charts?.ageGroup,
		dashboardData?.stats?.total,
		1
	);
	const dateTrendChart =
		dashboardData?.charts?.dateTrend?.map((d: any) => ({
			...d,
			color: "var(--blueText)",
		})) || [];

	return {
		states: {
			filterType,
			filterNat,
			filterGender,
			filterVictim,
			filterPassport,
			filterCreator,
			filterProvince,
			filterRegion,
			filterAge,
			startDate,
			endDate,
			dobStart,
			dobEnd,
			currentPage,
			sortField,
			sortDirection,
			loading,
			isUpdating,
			dashboardData,
		},
		actions: {
			handleFilterChange,
			handleSort,
			resetFilters,
			handleTypeChange,
			setCurrentPage,
			setFilterNat,
			setFilterGender,
			setFilterVictim,
			setFilterPassport,
			setFilterCreator,
			setFilterProvince,
			setFilterRegion,
			setFilterAge,
			setStartDate,
			setEndDate,
			setDobStart,
			setDobEnd,
		},
		derived: {
			nationalitiesOptions,
			gendersOptions,
			creatorsOptions,
			provincesOptions,
			regionsOptions,
			ageOptions,
			tableRows,
			stats,
			natChart,
			provinceChart,
			regionChart,
			genderChart,
			victimChart,
			passportChart,
			creatorChart,
			ageChart,
			dateTrendChart,
			totalPages: dashboardData?.meta?.totalPages || 1,
			totalItems: dashboardData?.meta?.totalItems || 0,
		},
	};
}
