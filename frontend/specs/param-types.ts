import type { BusinessType, OperationType } from "../src/lib/financial-types";

export interface DateRangeFilter {
  /** Optional inclusive lower date bound; API query name `start_date`, formatted as `YYYY-MM-DD` or null. */
  start_date?: string | null;
  /** Optional inclusive upper date bound; API query name `end_date`, formatted as `YYYY-MM-DD` or null. */
  end_date?: string | null;
}

export interface AlertsParams extends DateRangeFilter {
  /** Alert increase threshold; OpenAPI accepts numbers >= 0 with default 0.3. PM requirement is 0.01–1.0 with default 0.3. */
  threshold?: number;
  /** Aggregation period: `day`, `week`, or `month`; API default is `month`. */
  group_by?: "day" | "week" | "month";
  /** Optional business filter: `B2B` or `B2C`, or null. */
  business_type?: BusinessType | null;
}

export interface TopCategoriesParams extends DateRangeFilter {
  /** Operation filter: `income` or `outcome`; API default is `outcome`, while the PM feature requires `income`. */
  operation_type?: OperationType;
  /** Maximum number of categories; OpenAPI requires an integer from 1 to 20, default 5. */
  limit?: number;
  /** Optional business filter: `B2B` or `B2C`, or null. */
  business_type?: BusinessType | null;
}
