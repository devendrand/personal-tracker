// Net Worth Tracker - Type definitions

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability'
}

export enum AccountCategory {
  // Assets
  CASH = 'cash',
  CHECKING = 'checking',
  SAVINGS = 'savings',
  INVESTMENT = 'investment',
  RETIREMENT = 'retirement',
  REAL_ESTATE = 'real_estate',
  VEHICLE = 'vehicle',
  OTHER_ASSET = 'other_asset',
  // Liabilities
  CREDIT_CARD = 'credit_card',
  MORTGAGE = 'mortgage',
  AUTO_LOAN = 'auto_loan',
  STUDENT_LOAN = 'student_loan',
  PERSONAL_LOAN = 'personal_loan',
  OTHER_LIABILITY = 'other_liability'
}

export const ASSET_CATEGORIES = [
  AccountCategory.CASH,
  AccountCategory.CHECKING,
  AccountCategory.SAVINGS,
  AccountCategory.INVESTMENT,
  AccountCategory.RETIREMENT,
  AccountCategory.REAL_ESTATE,
  AccountCategory.VEHICLE,
  AccountCategory.OTHER_ASSET
];

export const LIABILITY_CATEGORIES = [
  AccountCategory.CREDIT_CARD,
  AccountCategory.MORTGAGE,
  AccountCategory.AUTO_LOAN,
  AccountCategory.STUDENT_LOAN,
  AccountCategory.PERSONAL_LOAN,
  AccountCategory.OTHER_LIABILITY
];

export interface NWAccount {
  id: number;
  name: string;
  accountType: AccountType;
  category: AccountCategory;
  institution?: string;
  notes?: string;
  isActive: boolean;
  currentBalance?: number;
}

export interface NWAccountCreate {
  name: string;
  accountType: AccountType;
  category: AccountCategory;
  institution?: string;
  notes?: string;
  isActive?: boolean;
}

export interface SnapshotBalanceEntry {
  accountId: number;
  balance: number;
  notes?: string;
}

export interface SnapshotBalanceResponse extends SnapshotBalanceEntry {
  id: number;
  account: NWAccount;
}

export interface NWSnapshot {
  id: number;
  snapshotDate: string;
  notes?: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  balances: SnapshotBalanceResponse[];
}

export interface NWSnapshotCreate {
  snapshotDate: string;
  notes?: string;
  balances: SnapshotBalanceEntry[];
}

export interface NWSnapshotSummary {
  id: number;
  snapshotDate: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  notes?: string;
}

export interface NetWorthSummary {
  currentNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  snapshotDate: string;
  changeFromPrevious: number;
  changePercent: number;
  assetsByCategory: Record<string, number>;
  liabilitiesByCategory: Record<string, number>;
}

export interface TrendDataPoint {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export interface NetWorthTrendResponse {
  dataPoints: TrendDataPoint[];
  periodStart: string;
  periodEnd: string;
  netChange: number;
  netChangePercent: number;
}

export interface CategoryBreakdown {
  category: string;
  accounts: NWAccount[];
  total: number;
  percentOfType: number;
}

// Helper function to format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

// Helper function to get category display name
export function getCategoryDisplayName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
