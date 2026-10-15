import { describe, expect, it } from "vitest";

import {
  computeKPIs,
  computeMonthlyData,
  formatCurrency,
  formatPercent,
} from "./financial-utils";
import { isFinancialMovement, isFinancialMovementList } from "./financial-types";
import type { FinancialMovement } from "./financial-types";

const sampleMovements: FinancialMovement[] = [
  {
    create_date: "2024-01-10",
    amount: 1000,
    operation_type: "income",
    category: "sales",
    business_type: "B2B",
  },
  {
    create_date: "2024-01-15",
    amount: 250,
    operation_type: "outcome",
    category: "suppliers",
    business_type: "B2B",
  },
  {
    create_date: "2024-02-01",
    amount: 500,
    operation_type: "income",
    category: "sales",
    business_type: "B2C",
  },
];

describe("financial movement contract", () => {
  it("accepts a movement matching the API contract", () => {
    expect(isFinancialMovement(sampleMovements[0])).toBe(true);
    expect(isFinancialMovementList(sampleMovements)).toBe(true);
  });

  it("rejects invalid enum values and non-numeric amounts", () => {
    expect(
      isFinancialMovement({ ...sampleMovements[0], operation_type: "refund" }),
    ).toBe(false);
    expect(isFinancialMovement({ ...sampleMovements[0], amount: "1000" })).toBe(
      false,
    );
    expect(isFinancialMovementList([sampleMovements[0], null])).toBe(false);
  });
});

describe("computeKPIs", () => {
  it("calculates totals and profit values", () => {
    const metrics = computeKPIs(sampleMovements);

    expect(metrics).toEqual({
      totalIncome: 1500,
      totalOutcome: 250,
      profit: 1250,
      profitPercent: (1250 / 1500) * 100,
    });
  });

  it("returns zero margin and negative profit when income is zero", () => {
    const onlyOutcomes: FinancialMovement[] = [
      {
        create_date: "2024-03-05",
        amount: 350,
        operation_type: "outcome",
        category: "operational",
        business_type: "B2B",
      },
    ];

    const metrics = computeKPIs(onlyOutcomes);
    expect(metrics).toEqual({
      totalIncome: 0,
      totalOutcome: 350,
      profit: -350,
      profitPercent: 0,
    });
  });

  it("calculates totals for fractional amounts without rounding them", () => {
    const fractionalMovements: FinancialMovement[] = [
      { ...sampleMovements[0], amount: 10.5 },
      { ...sampleMovements[1], amount: 2.25 },
    ];

    const metrics = computeKPIs(fractionalMovements);

    expect(metrics.totalIncome).toBe(10.5);
    expect(metrics.totalOutcome).toBe(2.25);
    expect(metrics.profit).toBe(8.25);
    expect(metrics.profitPercent).toBeCloseTo((8.25 / 10.5) * 100);
  });
});

describe("computeMonthlyData", () => {
  it("returns chronological year-month points with aggregated totals", () => {
    const unsortedCrossYearMovements: FinancialMovement[] = [
      {
        create_date: "2026-01-08",
        amount: 300,
        operation_type: "income",
        category: "sales",
        business_type: "B2C",
      },
      {
        create_date: "2025-12-05",
        amount: 200,
        operation_type: "outcome",
        category: "operational",
        business_type: "B2B",
      },
      {
        create_date: "2025-12-03",
        amount: 1000,
        operation_type: "income",
        category: "sales",
        business_type: "B2B",
      },
    ];
    const monthlyData = computeMonthlyData(unsortedCrossYearMovements);

    expect(monthlyData).toHaveLength(2);
    expect(monthlyData[0]).toEqual({
      month: "Dec 2025",
      income: 1000,
      outcome: 200,
      profitPercent: 80,
    });
    expect(monthlyData[1]).toEqual({
      month: "Jan 2026",
      income: 300,
      outcome: 0,
      profitPercent: 100,
    });
  });
});

describe("formatters", () => {
  it("formats currency without decimals", () => {
    expect(formatCurrency(1234.56)).toBe("$1,235");
  });

  it("formats percent with one decimal", () => {
    expect(formatPercent(15.555)).toBe("15.6%");
  });
});
