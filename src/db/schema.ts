// ============================================================
// Database Schema - SQL for creating tables
// ============================================================

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES = `
  -- Track schema version for migrations
  CREATE TABLE IF NOT EXISTS schema_info (
    version INTEGER NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Decks table
  CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status TEXT NOT NULL DEFAULT 'local_only',
    is_deleted INTEGER NOT NULL DEFAULT 0
  );

  -- Cards table with SM-2 spaced repetition fields
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    sync_status TEXT NOT NULL DEFAULT 'local_only',
    is_deleted INTEGER NOT NULL DEFAULT 0,

    -- SM-2 fields
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 0,
    repetitions INTEGER NOT NULL DEFAULT 0,
    next_review_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (deck_id) REFERENCES decks(id)
  );

  -- Review history
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    reviewed_at TEXT NOT NULL DEFAULT (datetime('now')),
    time_spent_ms INTEGER NOT NULL DEFAULT 0,
    ease_factor_after REAL NOT NULL,
    interval_after INTEGER NOT NULL,
    repetitions_after INTEGER NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'local_only',

    FOREIGN KEY (card_id) REFERENCES cards(id)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
  CREATE INDEX IF NOT EXISTS idx_cards_next_review ON cards(next_review_at);
  CREATE INDEX IF NOT EXISTS idx_cards_deck_review ON cards(deck_id, next_review_at, is_deleted);
  CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON reviews(card_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(reviewed_at);
  CREATE INDEX IF NOT EXISTS idx_sync_status_cards ON cards(sync_status);
  CREATE INDEX IF NOT EXISTS idx_sync_status_decks ON decks(sync_status);
`;
