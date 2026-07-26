import { Transaction } from '../models/Transaction';
import { getDatabase } from './database';

export async function insertTransaction(transaction: Transaction) {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT OR REPLACE INTO transactions
    (
      id,
      user_id,
      type,
      amount,
      category,
      description,
      transaction_date,
      receipt_uri,
      sync_status,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    transaction.id,
    transaction.userId,
    transaction.type,
    transaction.amount,
    transaction.category,
    transaction.description ?? null,
    transaction.transactionDate,
    transaction.receiptUri ?? null,
    transaction.syncStatus,
    transaction.createdAt,
    transaction.updatedAt
  );
}

export async function getTransactions(userId: string) {
  const db = await getDatabase();

  return db.getAllAsync<Transaction>(
    `SELECT
      id,
      user_id AS userId,
      type,
      amount,
      category,
      description,
      transaction_date AS transactionDate,
      receipt_uri AS receiptUri,
      sync_status AS syncStatus,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM transactions
    WHERE user_id = ?
    ORDER BY transaction_date DESC`,
    userId
  );
}

export async function getTransaction(id: string) {
  const db = await getDatabase();
  return db.getFirstAsync<Transaction>(
    `SELECT id, user_id AS userId, type, amount, category, description,
      transaction_date AS transactionDate, receipt_uri AS receiptUri,
      sync_status AS syncStatus, created_at AS createdAt, updated_at AS updatedAt
     FROM transactions WHERE id = ?`,
    id
  );
}

export async function deleteTransaction(id: string) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export async function getPendingTransactions() {
  const db = await getDatabase();

  return db.getAllAsync<Transaction>(
    `SELECT
      id,
      user_id AS userId,
      type,
      amount,
      category,
      description,
      transaction_date AS transactionDate,
      receipt_uri AS receiptUri,
      sync_status AS syncStatus,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM transactions
    WHERE sync_status IN ('pending', 'failed')`
  );
}

export async function updateTransactionSyncStatus(id: string, syncStatus: Transaction['syncStatus']) {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE transactions
     SET sync_status = ?
     WHERE id = ?`,
    syncStatus,
    id
  );
}

export async function markTransactionSynced(id: string) {
  await updateTransactionSyncStatus(id, 'synced');
}

export async function markTransactionFailed(id: string) {
  await updateTransactionSyncStatus(id, 'failed');
}
