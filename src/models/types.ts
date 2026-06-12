// ============================================================
// Skippy Data Models
// Designed for local-first with future sync capability
// ============================================================

// Sync status for future cloud migration
export enum SyncStatus {
  LOCAL_ONLY = 'local_only',   // Never synced
  SYNCED = 'synced',           // Up to date with server
  PENDING = 'pending',         // Local changes not yet pushed
  CONFLICT = 'conflict',       // Conflicts with server version
}

// ============================================================
// DECKS - Collections of cards
// ============================================================
export interface Deck {
  id: string;              // UUID - no collisions across devices
  name: string;
  description: string;
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
  sync_status: SyncStatus;
  is_deleted: boolean;     // Soft delete for sync
}

export interface CreateDeckInput {
  name: string;
  description?: string;
}

export interface UpdateDeckInput {
  name?: string;
  description?: string;
}

// ============================================================
// CARDS - Individual flashcards within a deck
// ============================================================
export interface Card {
  id: string;              // UUID
  deck_id: string;         // Foreign key to Deck
  front: string;           // Question / prompt
  back: string;            // Answer / response
  tags: string;            // Comma-separated tags for filtering
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
  is_deleted: boolean;

  // SM-2 Spaced Repetition Fields
  ease_factor: number;     // Difficulty multiplier (default 2.5)
  interval: number;        // Days until next review
  repetitions: number;     // Consecutive correct answers
  next_review_at: string;  // When to show this card next
}

export interface CreateCardInput {
  deck_id: string;
  front: string;
  back: string;
  tags?: string;
}

export interface UpdateCardInput {
  front?: string;
  back?: string;
  tags?: string;
}

// ============================================================
// REVIEW HISTORY - Log of every review session
// ============================================================
export interface Review {
  id: string;              // UUID
  card_id: string;         // Foreign key to Card
  rating: ReviewRating;    // How well the user did
  reviewed_at: string;     // When the review happened
  time_spent_ms: number;   // How long they spent (optional tracking)

  // Snapshot of card state AFTER this review
  ease_factor_after: number;
  interval_after: number;
  repetitions_after: number;

  sync_status: SyncStatus;
}

// SM-2 rating scale
export enum ReviewRating {
  AGAIN = 0,     // Complete blackout, reset
  HARD = 1,      // Significant difficulty
  GOOD = 2,      // Correct with some effort
  EASY = 3,      // Perfect, effortless recall
}

// ============================================================
// STUDY SESSION - Cards due for review
// ============================================================
export interface StudySession {
  deck_id: string;
  cards_due: Card[];
  total_due: number;
}
