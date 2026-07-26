import { Budget } from '@/models/Budget';
import { SavingsGoal } from '@/models/SavingsGoal';
import { getDatabase } from './database';

export async function saveBudget(budget: Budget) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO budgets
      (id, user_id, category, month, limit_amount, spent_amount, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    budget.id, budget.userId, budget.category, budget.month, budget.limitAmount,
    budget.spentAmount, budget.syncStatus, budget.createdAt, budget.updatedAt
  );
}

export async function getBudgets(userId: string) {
  const db = await getDatabase();
  return db.getAllAsync<Budget>(
    `SELECT id, user_id AS userId, category, month, limit_amount AS limitAmount,
      spent_amount AS spentAmount, sync_status AS syncStatus,
      created_at AS createdAt, updated_at AS updatedAt
     FROM budgets WHERE user_id = ? ORDER BY month DESC, category`,
    userId
  );
}

export async function deleteBudget(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budgets WHERE id = ?', id);
}

export async function saveSavingsGoal(goal: SavingsGoal) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO savings_goals
      (id, user_id, title, target_amount, current_amount, target_date, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    goal.id, goal.userId, goal.title, goal.targetAmount, goal.currentAmount,
    goal.targetDate ?? null, goal.syncStatus, goal.createdAt, goal.updatedAt
  );
}

export async function getSavingsGoals(userId: string) {
  const db = await getDatabase();
  return db.getAllAsync<SavingsGoal>(
    `SELECT id, user_id AS userId, title, target_amount AS targetAmount,
      current_amount AS currentAmount, target_date AS targetDate,
      sync_status AS syncStatus, created_at AS createdAt, updated_at AS updatedAt
     FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC`,
    userId
  );
}

export async function deleteSavingsGoal(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM savings_goals WHERE id = ?', id);
}
