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
  incomes?: AmountLine[];
  costs?: AmountLine[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}
