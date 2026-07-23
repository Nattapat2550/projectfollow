export type PersonType = "illegal" | "repatriated";

export type GetDashboardStatsRequestQuery = {
  nationality?: string;
  province?: string;
  region?: string;
  gender?: string;
  startDate?: string;
  endDate?: string;
  dobStart?: string;
  dobEnd?: string;
  isVictim?: string;
  hasPassport?: string;
  creator?: string;
  ageGroup?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

type Charts = Record<
  | "gender"
  | "victim"
  | "nationality"
  | "province"
  | "region"
  | "ageGroup"
  | "dateTrend",
  { name: string; value: number }[]
> & {
  creator?: {
    name: string;
    value: number;
    color?: string;
  }[];
};

export type DashboardStatsCharts<T extends PersonType> = T extends "illegal"
  ? Charts & Record<"passport", { name: string; value: number }[]>
  : Charts;

type Stats = Record<"total" | "victims", number>;

export type DashboardStatsStats<T extends PersonType> = T extends "illegal"
  ? Stats & Record<"hasPassport", number>
  : Stats;

export type DashboardStatsMeta = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  allNationalities: string[];
  allGenders: string[];
  allCreators?: string[];
  allProvinces?: string[];
  allRegions?: string[];
};

export type GetDashboardStatsResponse<T extends PersonType> = {
  success: true;
  stats: DashboardStatsStats<T>;
  charts: DashboardStatsCharts<T>;
  meta: DashboardStatsMeta;
  tableData: T extends "illegal" ? IllegalData[] : RepatriatedData[];
};
