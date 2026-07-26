type DatabaseRow = Record<string, unknown>;

type DatabaseLike = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, ...params: unknown[]) => Promise<void>;
  getAllAsync: <T = DatabaseRow>(sql: string, ...params: unknown[]) => Promise<T[]>;
  getFirstAsync: <T = DatabaseRow>(sql: string, ...params: unknown[]) => Promise<T | null>;
};

let database: DatabaseLike | null = null;

export async function getDatabase() {
  if (!database) {
    database = {
      execAsync: async () => undefined,
      runAsync: async () => undefined,
      getAllAsync: async () => [],
      getFirstAsync: async () => null,
    };
  }

  return database;
}

export async function initializeDatabase() {
  const db = await getDatabase();
  await db.execAsync('SELECT 1');
}

export async function getInitializedDatabase() {
  await initializeDatabase();
  return getDatabase();
}
