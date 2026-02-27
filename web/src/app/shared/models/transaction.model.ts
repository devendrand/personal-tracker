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

  leg_type: string | null;
  strategy_group_id: string | null;
  round_trip_group_id: string | null;
  created_at: string;
}

export interface RoundTripGroup {
  id: string;
  display_order: number;
  member_count: number;
  created_at: string;
}

export interface RoundTripGroupDetail extends RoundTripGroup {
  members: Transaction[];
}

export interface LinkTransactionsRequest {
  transaction_ids: string[];
}

export interface AddToGroupRequest {
  transaction_ids: string[];
}

export interface RemoveFromGroupRequest {
  transaction_ids: string[];
}

export interface LegTypeOption {
  value: string;
  label: string;
  description: string;
}

export interface TransactionUploadResponse {
  imported: number;
  skipped: number;
  failed: number;
  duplicates: number;
  unassigned: number;
}

export interface StrategyGroup {
  id: string;
  name: string;
  symbol: string;
  created_at: string;
}

export interface StrategyGroupCreate {
  name: string;
  symbol: string;
}
