/** A shipment the user can ask to evaluate. */
export interface Shipment {
  id: number;
  reference: string;
  customer: string;
}

/** One income or cost record behind a calculation. */
export interface AmountLine {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  /** Echoed back with a correction, so the backend can refuse a stale one (409). */
  version: number;
}

/** The outcome of the Calculate Profit use case. */
export interface ProfitCalculation {
  id: number;
  shipmentReference: string;
  customer: string;
  totalIncome: number;
  totalCosts: number;
  profitOrLoss: number;
  calculatedAt: string;
  /**
   * Only on a calculation request: false when nothing changed since the shipment's
   * latest calculation, which is returned instead of storing a duplicate.
   */
  created?: boolean;
  incomes?: AmountLine[];
  costs?: AmountLine[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

/** A shipment with everything recorded against it. */
export interface ShipmentDetail {
  id: number;
  reference: string;
  customer: string;
  incomes: AmountLine[];
  costs: AmountLine[];
  totalIncome: number;
  totalCosts: number;
}

export const INCOME_TYPES = ['CUSTOMER_PAYMENT', 'AGENT_INCOME'] as const;
export const COST_TYPES = ['MAIN_CARRIAGE', 'HANDLING', 'CUSTOMS', 'OTHER'] as const;
