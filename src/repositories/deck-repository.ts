import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Deck, CreateDeckInput, UpdateDeckInput, SyncStatus } from '../models/types';

export class DeckRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Create a new deck.
   */
  create(input: CreateDeckInput): Deck {
    const now = new Date().toISOString();
    const deck: Deck = {
      id: uuidv4(),
      name: input.name,
      description: input.description || '',
      created_at: now,
      updated_at: now,
      sync_status: SyncStatus.LOCAL_ONLY,
      is_deleted: false,
    };

    this.db
      .prepare(
        `INSERT INTO decks (id, name, description, created_at, updated_at, sync_status, is_deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        deck.id,
        deck.name,
        deck.description,
        deck.created_at,
        deck.updated_at,
        deck.sync_status,
        deck.is_deleted ? 1 : 0
      );

    return deck;
  }

  /**
   * Get a deck by ID (excludes soft-deleted).
   */
  getById(id: string): Deck | null {
    const row = this.db
      .prepare('SELECT * FROM decks WHERE id = ? AND is_deleted = 0')
      .get(id) as any;

    return row ? this.rowToDeck(row) : null;
  }

  /**
   * Get all decks (excludes soft-deleted).
   */
  getAll(): Deck[] {
    const rows = this.db
      .prepare('SELECT * FROM decks WHERE is_deleted = 0 ORDER BY created_at DESC')
      .all() as any[];

    return rows.map(this.rowToDeck);
  }

  /**
   * Update a deck.
   */
  update(id: string, input: UpdateDeckInput): Deck | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }

    updates.push('updated_at = ?');
    values.push(now);
    updates.push('sync_status = ?');
    values.push(SyncStatus.PENDING);

    values.push(id);

    this.db
      .prepare(`UPDATE decks SET ${updates.join(', ')} WHERE id = ?`)
      .run(...values);

    return this.getById(id);
  }

  /**
   * Soft-delete a deck (marks as deleted, doesn't remove from DB).
   */
  delete(id: string): boolean {
    const result = this.db
      .prepare(
        `UPDATE decks SET is_deleted = 1, updated_at = ?, sync_status = ? WHERE id = ?`
      )
      .run(new Date().toISOString(), SyncStatus.PENDING, id);

    return result.changes > 0;
  }

  /**
   * Get card count for a deck.
   */
  getCardCount(deckId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND is_deleted = 0')
      .get(deckId) as { count: number };

    return row.count;
  }

  private rowToDeck(row: any): Deck {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sync_status: row.sync_status,
      is_deleted: row.is_deleted === 1,
    };
  }
}
