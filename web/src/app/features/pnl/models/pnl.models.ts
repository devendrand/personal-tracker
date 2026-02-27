/**
 * PnL models — TypeScript interfaces matching api/app/schemas/pnl.py
 */

export interface LegPnL {
  transaction_id: string;
  activity_date: string;
  activity_type: string;
  description: string;
  leg_type: string;
  amount: string;       // Decimal serialized as string
  realized_pnl: string; // Decimal serialized as string
  commission: string;   // Decimal serialized as string, absolute value
}

export interface StrategyGroupPnL {
  strategy_group_id: string | null;
  name: string;
  total_realized_pnl: string;
  legs: LegPnL[];
  transaction_count: number;
  total_commission: string;
}

export interface TickerPnL {
  symbol: string;
  total_realized_pnl: string;
  groups: StrategyGroupPnL[];
  transaction_count: number;
  total_commission: string;
}

export interface PnLSummaryResponse {
  total_realized_pnl: string;
  tickers: TickerPnL[];
  total_transaction_count: number;
  total_commission: string;
}
