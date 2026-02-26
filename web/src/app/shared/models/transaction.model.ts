/**
 * Transaction model interfaces (aligned with backend API).
 */

export interface Transaction {
  id: string;
  activity_date: string;
  activity_type: string;
  description: string;

  symbol?: string | null;
  quantity?: number | null;
  price?: number | null;
  amount?: number | null;

  strategy_type: string | null;
  created_at: string;
}

export interface TransactionUploadResponse {
  imported: number;
  skipped: number;
  failed: number;
  duplicates: number;
  unassigned: number;
}
