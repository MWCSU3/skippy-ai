import { ReviewRating } from '../models/types';

// ============================================================
// SM-2 Algorithm (SuperMemo 2)
// The same algorithm Anki uses at its core.
//
// How it works:
// - Each card has an ease_factor (difficulty), interval (days), and repetitions count
// - After each review, these are updated based on how well you recalled
// - Cards you struggle with come back sooner, easy cards space out further
// ============================================================

export interface SM2Input {
  ease_factor: number;    // Current ease factor (min 1.3)
  interval: number;       // Current interval in days
  repetitions: number;    // Consecutive correct answers
  rating: ReviewRating;   // How the user rated this review
}

export interface SM2Output {
  ease_factor: number;    // New ease factor
  interval: number;       // New interval in days
  repetitions: number;    // New repetition count
  next_review_at: string; // ISO timestamp of next review
}

/**
 * Calculate the next review state using SM-2 algorithm.
 */
export function calculateSM2(input: SM2Input): SM2Output {
  const { ease_factor, interval, repetitions, rating } = input;

  let newEaseFactor = ease_factor;
  let newInterval: number;
  let newRepetitions: number;

  if (rating === ReviewRating.AGAIN) {
    // Failed — reset to beginning
    newRepetitions = 0;
    newInterval = 1; // Review again tomorrow
    // Decrease ease factor (card is harder than we thought)
    newEaseFactor = Math.max(1.3, ease_factor - 0.2);
  } else if (rating === ReviewRating.HARD) {
    // Got it but with difficulty
    newRepetitions = repetitions + 1;
    // Shorter interval than normal
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 4;
    } else {
      newInterval = Math.round(interval * 1.2); // Grow slower
    }
    newEaseFactor = Math.max(1.3, ease_factor - 0.15);
  } else if (rating === ReviewRating.GOOD) {
    // Standard correct response
    newRepetitions = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * ease_factor);
    }
    // Ease factor stays roughly the same
    newEaseFactor = Math.max(1.3, ease_factor + 0.0);
  } else {
    // Easy — perfect recall
    newRepetitions = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 4;
    } else if (repetitions === 1) {
      newInterval = 10;
    } else {
      newInterval = Math.round(interval * ease_factor * 1.3); // Grow faster
    }
    // Increase ease factor (card is easier than we thought)
    newEaseFactor = ease_factor + 0.15;
  }

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);
  const next_review_at = nextReview.toISOString();

  return {
    ease_factor: Math.round(newEaseFactor * 100) / 100, // 2 decimal places
    interval: newInterval,
    repetitions: newRepetitions,
    next_review_at,
  };
}
