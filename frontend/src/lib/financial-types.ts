export type OperationType = 'income' | 'outcome'
export type Category = 'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'
export type BusinessType = 'B2B' | 'B2C'

export interface FinancialMovement {
  create_date: string // ISO date
  amount: number
  operation_type: OperationType
  category: Category
  business_type: BusinessType
}

export interface KPIMetrics {
  totalIncome: number
  totalOutcome: number
  profit: number
  profitPercent: number
}

export interface MonthlyDataPoint {
  month: string
  income: number
  outcome: number
  profitPercent: number
}

const operationTypes: readonly OperationType[] = ['income', 'outcome']
const categories: readonly Category[] = [
  'suppliers',
  'sales',
  'operational',
  'administrative',
  'others',
]
const businessTypes: readonly BusinessType[] = ['B2B', 'B2C']

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T)
}

export function isFinancialMovement(value: unknown): value is FinancialMovement {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const movement = value as Record<string, unknown>
  return (
    typeof movement.create_date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(movement.create_date) &&
    typeof movement.amount === 'number' &&
    Number.isFinite(movement.amount) &&
    isOneOf(movement.operation_type, operationTypes) &&
    isOneOf(movement.category, categories) &&
    isOneOf(movement.business_type, businessTypes)
  )
}

export function isFinancialMovementList(value: unknown): value is FinancialMovement[] {
  return Array.isArray(value) && value.every(isFinancialMovement)
}
