export type TransactionType = 'income' | 'expense';
export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  transactionDate: string;
  receiptUri?: string;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}
