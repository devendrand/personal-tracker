/**
 * Portfolio model interfaces
 */

export type PortfolioType = 
  | 'WHEEL_STRATEGY'
  | 'COVERED_CALL'
  | 'LONG_HOLD'
  | 'SIP'
  | 'SPECULATIVE'
  | 'CUSTOM';

export interface Portfolio {
  id: number;
  name: string;
  type: PortfolioType;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummary extends Portfolio {
  totalInvested: number;
  currentValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  premiumCollected: number;
  winRate: number;
  openPositions: number;
  closedPositions: number;
}
