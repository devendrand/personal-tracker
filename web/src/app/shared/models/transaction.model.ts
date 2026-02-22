/**
 * Transaction model interfaces
 */

export type TransactionType = 
  | 'EQUITY_BUY'
  | 'EQUITY_SELL'
  | 'OPTION_BUY'
  | 'OPTION_SELL'
  | 'ASSIGNMENT'
  | 'EXPIRATION'
  | 'EXERCISE'
  | 'DIVIDEND';

export interface Transaction {
  id: number;
  date: string;
  ticker: string;
  action: TransactionType;
  quantity: number;
  price: number;
  fees: number;
  rawData?: Record<string, unknown>;
  createdAt: string;
  portfolioIds?: number[];
}

export interface TransactionUploadResponse {
  preview: Transaction[];
  duplicates: number;
  newRecords: number;
}
