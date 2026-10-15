import type {
  BusinessType,
  Category,
  OperationType,
} from "../src/lib/financial-types";

export interface FacetsResponse {
  /** Available operation types: `income` or `outcome`. */
  operation_types: OperationType[];
  /** Available business types: `B2B` or `B2C`. */
  business_types: BusinessType[];
  /** Available categories: `suppliers`, `sales`, `operational`, `administrative`, or `others`. */
  categories: Category[];
  /** Earliest available date in ISO `YYYY-MM-DD` format. */
  min_date: string;
  /** Latest available date in ISO `YYYY-MM-DD` format. */
  max_date: string;
}

export interface AlertEntry {
  /** Period label: `YYYY-MM-DD` for day, `YYYY-Www` for week, or `YYYY-MM` for month. */
  period: string;
  /** Recorded outcome total for this period, as a numeric amount. */
  outcome_total: number;
  /** Historical outcome baseline as a numeric amount; current backend averages all prior periods, not only three. */
  baseline_average: number;
  /** Increase ratio `(outcome_total - baseline_average) / baseline_average`; a ratio, not a percentage value. */
  increase_ratio: number;
}

/** Array response returned by `GET /api/metrics/alerts`. */
export type AlertsResponse = AlertEntry[];

export interface CategoryEntry {
  /** Category name: `suppliers`, `sales`, `operational`, `administrative`, or `others`. */
  category: Category;
  /** Operation type: `income` or `outcome`. */
  operation_type: OperationType;
  /** Total amount for this category and operation type, as a numeric amount. */
  total_amount: number;
}

/** Array response returned by `GET /api/metrics/categories/top`. */
export type TopCategoriesResponse = CategoryEntry[];

export interface MetricsSummaryItem {
  /** Aggregated period label; format depends on `group_by` (`day`, `week`, or `month`). */
  period: string;
  /** Total income for this period. */
  income: number;
  /** Total outcome for this period. */
  outcome: number;
  /** Net amount for this period: income minus outcome. */
  net: number;
}

/** Array response returned by `GET /api/metrics/summary`. */
export type MetricsSummaryResponse = MetricsSummaryItem[];
