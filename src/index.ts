// ============================================================
// Skippy Backend - Entry Point
// Local-first spaced repetition engine
// ============================================================

import { getDatabase, closeDatabase, DatabaseOptions } from './db';
import { DeckRepository, CardRepository, ReviewRepository } from './repositories';
import { StudyService, WebSearchService, SearchProvider } from './services';
import { ReviewRating } from './models/types';

export { getDatabase, closeDatabase } from './db';
export { DeckRepository, CardRepository, ReviewRepository } from './repositories';
export { StudyService, calculateSM2, WebSearchService, DuckDuckGoProvider, GoogleSearchProvider } from './services';
export * from './models/types';

/**
 * Skippy - Main API class.
 * This is what the frontend (Electron, React Native, etc.) imports and uses.
 */
export class Skippy {
  public decks: DeckRepository;
  public cards: CardRepository;
  public reviews: ReviewRepository;
  public study: StudyService;
  public search: WebSearchService;

  constructor(options: DatabaseOptions & { searchProvider?: SearchProvider } = {}) {
    const db = getDatabase(options);
    this.decks = new DeckRepository(db);
    this.cards = new CardRepository(db);
    this.reviews = new ReviewRepository(db);
    this.study = new StudyService(db);
    this.search = new WebSearchService(options.searchProvider);
  }

  /**
   * Close the database connection.
   */
  close(): void {
    closeDatabase();
  }
}

// ============================================================
// Demo / Smoke Test - runs when executed directly
// ============================================================
if (require.main === module) {
  console.log('🐙 Skippy Backend - Smoke Test\n');

  // Use in-memory DB for the demo
  const skippy = new Skippy({ inMemory: true });

  // Create a deck
  const deck = skippy.decks.create({ name: 'JavaScript Basics', description: 'Core JS concepts' });
  console.log('✅ Created deck:', deck.name, `(${deck.id.slice(0, 8)}...)`);

  // Add some cards
  const card1 = skippy.cards.create({
    deck_id: deck.id,
    front: 'What is a closure?',
    back: 'A function that retains access to variables from its enclosing scope, even after the outer function has returned.',
    tags: 'functions,scope',
  });
  const card2 = skippy.cards.create({
    deck_id: deck.id,
    front: 'What does === do differently than ==?',
    back: 'Strict equality (===) checks both value and type without coercion. Loose equality (==) performs type coercion before comparing.',
    tags: 'operators,equality',
  });
  const card3 = skippy.cards.create({
    deck_id: deck.id,
    front: 'What is the event loop?',
    back: 'The mechanism that allows JavaScript to perform non-blocking I/O by offloading operations and processing callbacks from a queue.',
    tags: 'async,runtime',
  });
  console.log(`✅ Added ${3} cards to deck\n`);

  // Get due cards (all should be due since they're new)
  const session = skippy.study.getStudySession(deck.id);
  console.log(`📚 Study session: ${session.total_due} cards due\n`);

  // Simulate reviewing cards
  console.log('--- Simulating reviews ---');

  const reviewed1 = skippy.study.reviewCard(card1.id, ReviewRating.GOOD);
  console.log(`  Card: "${card1.front.slice(0, 30)}..."`);
  console.log(`  Rating: GOOD → Next review in ${reviewed1?.interval} day(s)\n`);

  const reviewed2 = skippy.study.reviewCard(card2.id, ReviewRating.EASY);
  console.log(`  Card: "${card2.front.slice(0, 30)}..."`);
  console.log(`  Rating: EASY → Next review in ${reviewed2?.interval} day(s)\n`);

  const reviewed3 = skippy.study.reviewCard(card3.id, ReviewRating.AGAIN);
  console.log(`  Card: "${card3.front.slice(0, 30)}..."`);
  console.log(`  Rating: AGAIN → Next review in ${reviewed3?.interval} day(s)\n`);

  // Check stats
  const stats = skippy.study.getStats();
  console.log(`📊 Stats: ${stats.reviews_today} reviews today`);

  // Check what's still due (card3 should come back tomorrow)
  const afterSession = skippy.study.getStudySession(deck.id);
  console.log(`📚 Cards still due now: ${afterSession.total_due}`);

  // Search
  const results = skippy.cards.search('closure');
  console.log(`\n🔍 Search "closure": found ${results.length} card(s)`);

  // Deck info
  const cardCount = skippy.decks.getCardCount(deck.id);
  console.log(`📦 Deck "${deck.name}" has ${cardCount} card(s)`);

  skippy.close();
  console.log('\n✅ All good! Skippy backend is working.');
}
