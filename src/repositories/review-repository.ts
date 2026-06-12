import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { Review, ReviewRating, SyncStatus } from '../models/types';

export interface CreateReviewInput {
  card_id: string;
  rating: ReviewRating;
  time_spent_ms?: number;
  ease_factor_after: number;
  interval_after: number;
  repetitions_after: number;
}

export class ReviewRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Record a review.
   */
  create(input: CreateReviewInput): Review {
    const now = new Date().toISOString();
    const review: Review = {
      id: uuidv4(),
      card_id: input.card_id,
      rating: input.rating,
      reviewed_at: now,
      time_spent_ms: input.time_spent_ms || 0,
      ease_factor_after: input.ease_factor_after,
      interval_after: input.interval_after,
      repetitions_after: input.repetitions_after,
      sync_status: SyncStatus.LOCAL_ONLY,
    };

    this.db
      .prepare(
        `INSERT INTO reviews (id, card_id, rating, reviewed_at, time_spent_ms,
         ease_factor_after, interval_after, repetitions_after, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        review.id,
        review.card_id,
        review.rating,
        review.reviewed_at,
        review.time_spent_ms,
        review.ease_factor_after,
        review.interval_after,
        review.repetitions_after,
        review.sync_status
      );

    return review;
  }

  /**
   * Get review history for a card.
   */
  getByCardId(cardId: string, limit: number = 50): Review[] {
    const rows = this.db
      .prepare(
        'SELECT * FROM reviews WHERE card_id = ? ORDER BY reviewed_at DESC LIMIT ?'
      )
      .all(cardId, limit) as any[];

    return rows.map(this.rowToReview);
  }

  /**
   * Get recent reviews across all cards (for stats).
   */
  getRecent(limit: number = 100): Review[] {
    const rows = this.db
      .prepare('SELECT * FROM reviews ORDER BY reviewed_at DESC LIMIT ?')
      .all(limit) as any[];

    return rows.map(this.rowToReview);
  }

  /**
   * Get review count for today.
   */
  getTodayCount(): number {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const row = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM reviews WHERE reviewed_at >= ?"
      )
      .get(today + 'T00:00:00.000Z') as { count: number };

    return row.count;
  }

  /**
   * Get stats: reviews per day for the last N days.
   */
  getDailyStats(days: number = 30): { date: string; count: number; avg_rating: number }[] {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rows = this.db
      .prepare(
        `SELECT
           date(reviewed_at) as date,
           COUNT(*) as count,
           AVG(rating) as avg_rating
         FROM reviews
         WHERE reviewed_at >= ?
         GROUP BY date(reviewed_at)
         ORDER BY date ASC`
      )
      .all(startDate.toISOString()) as any[];

    return rows.map((row) => ({
      date: row.date,
      count: row.count,
      avg_rating: Math.round(row.avg_rating * 100) / 100,
    }));
  }

  private rowToReview(row: any): Review {
    return {
      id: row.id,
      card_id: row.card_id,
      rating: row.rating as ReviewRating,
      reviewed_at: row.reviewed_at,
      time_spent_ms: row.time_spent_ms,
      ease_factor_after: row.ease_factor_after,
      interval_after: row.interval_after,
      repetitions_after: row.repetitions_after,
      sync_status: row.sync_status,
    };
  }
}
