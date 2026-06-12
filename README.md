# Skippy AI

> Local-first spaced repetition engine with SQLite — the backend that powers smart flashcard learning.

## What It Does

Skippy is a spaced repetition engine built on the **SM-2 algorithm** (the same algorithm behind Anki). It helps you learn and retain information by scheduling flashcard reviews at optimal intervals.

### Features

- **SM-2 Spaced Repetition** — cards you struggle with come back sooner, easy cards space out further
- **Local-first architecture** — all data stored in SQLite (no internet required)
- **Web search integration** — auto-generate card answers from DuckDuckGo or Google
- **Sync-ready data model** — designed for future cloud sync across devices
- **Clean TypeScript API** — easy to integrate with Electron, React Native, or web frontends

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run smoke test
npm start
```

## Architecture

```
skippy-ai/
├── src/
│   ├── index.ts              # Main entry point & Skippy API class
│   ├── db/
│   │   ├── connection.ts     # SQLite connection management
│   │   ├── schema.ts         # Database schema & migrations
│   │   └── index.ts          # DB exports
│   ├── models/
│   │   ├── types.ts          # TypeScript interfaces & enums
│   │   └── index.ts          # Model exports
│   ├── repositories/
│   │   ├── card-repository.ts    # Card CRUD operations
│   │   ├── deck-repository.ts    # Deck CRUD operations
│   │   ├── review-repository.ts  # Review history tracking
│   │   └── index.ts              # Repository exports
│   └── services/
│       ├── sm2.ts                # SM-2 algorithm implementation
│       ├── study-service.ts      # Study session orchestration
│       ├── web-search-service.ts # Web search for card generation
│       └── index.ts              # Service exports
├── package.json
└── tsconfig.json
```

## Usage

```typescript
import { Skippy } from './src';

// Create instance (uses ~/.skippy/skippy.db by default)
const skippy = new Skippy();

// Create a deck
const deck = skippy.decks.create({ name: 'JavaScript', description: 'JS fundamentals' });

// Add cards
const card = skippy.cards.create({
  deck_id: deck.id,
  front: 'What is a closure?',
  back: 'A function that retains access to variables from its enclosing scope.'
});

// Study — get due cards
const session = skippy.study.getStudySession(deck.id);

// Review a card (AGAIN=0, HARD=1, GOOD=2, EASY=3)
skippy.study.reviewCard(card.id, 2); // GOOD

// Auto-generate cards from web search
const answer = await skippy.search.searchForAnswer('What is recursion?');

// Close when done
skippy.close();
```

## SM-2 Rating Scale

| Rating | Meaning | Effect |
|--------|---------|--------|
| 0 (AGAIN) | Complete blackout | Reset interval, review tomorrow |
| 1 (HARD) | Significant difficulty | Shorter interval, lower ease |
| 2 (GOOD) | Correct with effort | Normal interval growth |
| 3 (EASY) | Perfect recall | Longer interval, higher ease |

## Configuration

By default, Skippy stores data at `~/.skippy/skippy.db`. You can customize:

```typescript
// Custom database path
const skippy = new Skippy({ dbPath: '/path/to/my.db' });

// In-memory (for testing)
const skippy = new Skippy({ inMemory: true });

// Custom search provider
const skippy = new Skippy({ searchProvider: new GoogleSearchProvider(apiKey, engineId) });
```

## Tech Stack

- **TypeScript** — strict type safety
- **better-sqlite3** — fast, synchronous SQLite
- **UUID** — collision-free IDs across devices
- **SM-2 Algorithm** — proven spaced repetition scheduling

## License

MIT
