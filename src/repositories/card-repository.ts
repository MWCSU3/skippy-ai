import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Card, CreateCardInput, UpdateCardInput, SyncStatus } from '../models/types';

export class CardRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Create a new card.
   */
  create(input: CreateCardInput): Card {
    const now = new Date().toISOString();
    const card: Card = {
      id: uuidv4(),
      deck_id: input.deck_id,
      front: input.front,
      back: input.back,
      tags: input.tags || '',
      created_at: now,
      updated_at: now,
      sync_status: SyncStatus.LOCAL_ONLY,
      is_deleted: false,
      ease_factor: 2.5,
      interval: 0,
      repetitions: 0,
      next_review_at: now, // Due immediately
    };

    this.db
      .prepare(
        `INSERT INTO cards (id, deck_id, front, back, tags, created_at, updated_at,
         sync_status, is_deleted, ease_factor, interval, repetitions, next_review_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        card.id,
        card.deck_id,
        card.front,
        card.back,
        card.tags,
        card.created_at,
        card.updated_at,
        card.sync_status,
        card.is_deleted ? 1 : 0,
        card.ease_factor,
        card.interval,
        card.repetitions,
        card.next_review_at
      );

    return card;
  }

  /**
   * Get a card by ID.
   */
  getById(id: string): Card | null {
    const row = this.db
      .prepare('SELECT * FROM cards WHERE id = ? AND is_deleted = 0')
      .get(id) as any;

    return row ? this.rowToCard(row) : null;
  }

  /**
   * Get all cards in a deck.
   */
  getByDeckId(deckId: string): Card[] {
    const rows = this.db
      .prepare('SELECT * FROM cards WHERE deck_id = ? AND is_deleted = 0 ORDER BY created_at DESC')
      .all(deckId) as any[];

    return rows.map(this.rowToCard);
  }

  /**
   * Get cards that are due for review (next_review_at <= now).
   */
  getDueCards(deckId: string, limit: number = 20): Card[] {
    const now = new Date().toISOString();
    const rows = this.db
      .prepare(
        `SELECT * FROM cards
         WHERE deck_id = ? AND is_deleted = 0 AND next_review_at <= ?
         ORDER BY next_review_at ASC
         LIMIT ?`
      )
      .all(deckId, now, limit) as any[];

    return rows.map(this.rowToCard);
  }

  /**
   * Get all due cards across all decks.
   */
  getAllDueCards(limit: number = 50): Card[] {
    const now = new Date().toISOString();
    const rows = this.db
      .prepare(
        `SELECT * FROM cards
         WHERE is_deleted = 0 AND next_review_at <= ?
         ORDER BY next_review_at ASC
         LIMIT ?`
      )
      .all(now, limit) as any[];

    return rows.map(this.rowToCard);
  }

  /**
   * Update card content.
   */
  update(id: string, input: UpdateCardInput): Card | null {
    const existing = this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (input.front !== undefined) {
      updates.push('front = ?');
      values.push(input.front);
    }
    if (input.back !== undefined) {
      updates.push('back = ?');
      values.push(input.back);
    }
    if (input.tags !== undefined) {
      updates.push('tags = ?');
      values.push(input.tags);
    }

    updates.push('updated_at = ?');
    values.push(now);
    updates.push('sync_status = ?');
    values.push(SyncStatus.PENDING);

    values.push(id);

    this.db
      .prepare(`UPDATE cards SET ${updates.join(', ')} WHERE id = ?`)
      .run(...values);

    return this.getById(id);
  }

  /**
   * Update card's spaced repetition state (called after a review).
   */
  updateReviewState(
    id: string,
    easeFactor: number,
    interval: number,
    repetitions: number,
    nextReviewAt: string
  ): void {
    this.db
      .prepare(
        `UPDATE cards SET ease_factor = ?, interval = ?, repetitions = ?,
         next_review_at = ?, updated_at = ?, sync_status = ?
         WHERE id = ?`
      )
      .run(easeFactor, interval, repetitions, nextReviewAt, new Date().toISOString(), SyncStatus.PENDING, id);
  }

  /**
   * Soft-delete a card.
   */
  delete(id: string): boolean {
    const result = this.db
      .prepare(
        `UPDATE cards SET is_deleted = 1, updated_at = ?, sync_status = ? WHERE id = ?`
      )
      .run(new Date().toISOString(), SyncStatus.PENDING, id);

    return result.changes > 0;
  }

  /**
   * Search cards by front/back content.
   */
  search(query: string, deckId?: string): Card[] {
    const searchTerm = `%${query}%`;

    let sql = `SELECT * FROM cards WHERE is_deleted = 0 AND (front LIKE ? OR back LIKE ? OR tags LIKE ?)`;
    const params: any[] = [searchTerm, searchTerm, searchTerm];

    if (deckId) {
      sql += ' AND deck_id = ?';
      params.push(deckId);
    }

    sql += ' ORDER BY updated_at DESC LIMIT 50';

    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map(this.rowToCard);
  }

  private rowToCard(row: any): Card {
    return {
      id: row.id,
      deck_id: row.deck_id,
      front: row.front,
      back: row.back,
      tags: row.tags,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sync_status: row.sync_status,
      is_deleted: row.is_deleted === 1,
      ease_factor: row.ease_factor,
      interval: row.interval,
      repetitions: row.repetitions,
      next_review_at: row.next_review_at,
    };
  }
}
