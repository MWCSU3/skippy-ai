import Database from 'better-sqlite3';
import { Card, ReviewRating, StudySession } from '../models/types';
import { CardRepository } from '../repositories/card-repository';
import { ReviewRepository } from '../repositories/review-repository';
import { calculateSM2 } from './sm2';

/**
 * StudyService — orchestrates the review flow.
 * This is what the UI calls to run a study session.
 */
export class StudyService {
  private cardRepo: CardRepository;
  private reviewRepo: ReviewRepository;

  constructor(db: Database.Database) {
    this.cardRepo = new CardRepository(db);
    this.reviewRepo = new ReviewRepository(db);
  }

  /**
   * Get a study session — cards that are due for review in a deck.
   */
  getStudySession(deckId: string, limit: number = 20): StudySession {
    const cardsDue = this.cardRepo.getDueCards(deckId, limit);
    return {
      deck_id: deckId,
      cards_due: cardsDue,
      total_due: cardsDue.length,
    };
  }

  /**
   * Get all due cards across all decks.
   */
  getAllDueCards(limit: number = 50): Card[] {
    return this.cardRepo.getAllDueCards(limit);
  }

  /**
   * Submit a review for a card — updates spaced repetition state.
   * This is the core action: user sees card, rates their recall, state updates.
   */
  reviewCard(cardId: string, rating: ReviewRating, timeSpentMs: number = 0): Card | null {
    const card = this.cardRepo.getById(cardId);
    if (!card) return null;

    // Calculate new SM-2 state
    const result = calculateSM2({
      ease_factor: card.ease_factor,
      interval: card.interval,
      repetitions: card.repetitions,
      rating,
    });

    // Update the card's review state
    this.cardRepo.updateReviewState(
      cardId,
      result.ease_factor,
      result.interval,
      result.repetitions,
      result.next_review_at
    );

    // Record the review in history
    this.reviewRepo.create({
      card_id: cardId,
      rating,
      time_spent_ms: timeSpentMs,
      ease_factor_after: result.ease_factor,
      interval_after: result.interval,
      repetitions_after: result.repetitions,
    });

    // Return updated card
    return this.cardRepo.getById(cardId);
  }

  /**
   * Get stats for the dashboard.
   */
  getStats() {
    return {
      reviews_today: this.reviewRepo.getTodayCount(),
      daily_history: this.reviewRepo.getDailyStats(30),
    };
  }
}
