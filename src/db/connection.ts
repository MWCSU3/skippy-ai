import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_TABLES, SCHEMA_VERSION } from './schema';

let db: Database.Database | null = null;

export interface DatabaseOptions {
  // Path to the .db file. Defaults to ~/.skippy/skippy.db
  dbPath?: string;
  // Use :memory: for testing
  inMemory?: boolean;
}

/**
 * Get or create the database connection (singleton).
 * Creates the data directory and runs migrations if needed.
 */
export function getDatabase(options: DatabaseOptions = {}): Database.Database {
  if (db) return db;

  let dbPath: string;

  if (options.inMemory) {
    dbPath = ':memory:';
  } else if (options.dbPath) {
    dbPath = options.dbPath;
  } else {
    // Default location: ~/.skippy/skippy.db
    const dataDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.skippy'
    );
    // Create directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, 'skippy.db');
  }

  db = new Database(dbPath);

  // Performance settings for local use
  db.pragma('journal_mode = WAL');      // Better concurrent read/write
  db.pragma('foreign_keys = ON');       // Enforce relationships
  db.pragma('synchronous = NORMAL');    // Good balance of speed/safety

  // Run migrations
  migrate(db);

  return db;
}

/**
 * Close the database connection.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Run schema migrations.
 * For now this is simple — just creates tables if they don't exist.
 * As the app evolves, this will handle ALTER TABLE, etc.
 */
function migrate(database: Database.Database): void {
  // Check current version
  const tableExists = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_info'")
    .get();

  if (!tableExists) {
    // Fresh database — create everything
    database.exec(CREATE_TABLES);
    database
      .prepare('INSERT INTO schema_info (version) VALUES (?)')
      .run(SCHEMA_VERSION);
    return;
  }

  // Check version and run incremental migrations if needed
  const row = database
    .prepare('SELECT MAX(version) as version FROM schema_info')
    .get() as { version: number } | undefined;

  const currentVersion = row?.version || 0;

  if (currentVersion < SCHEMA_VERSION) {
    // Future: run migration scripts for each version bump
    // For now, just update the version
    runMigrations(database, currentVersion, SCHEMA_VERSION);
  }
}

/**
 * Placeholder for future incremental migrations.
 * Each version bump gets its own migration function.
 */
function runMigrations(
  database: Database.Database,
  fromVersion: number,
  toVersion: number
): void {
  // Example of how future migrations would work:
  // if (fromVersion < 2) { migrateToV2(database); }
  // if (fromVersion < 3) { migrateToV3(database); }

  database
    .prepare('INSERT INTO schema_info (version) VALUES (?)')
    .run(toVersion);
}
