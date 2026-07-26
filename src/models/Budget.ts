export interface Budget {
  id: string;
  userId: string;
  category: string;
  month: string;
  limitAmount: number;
  spentAmount: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: string;
  updatedAt: string;
}
