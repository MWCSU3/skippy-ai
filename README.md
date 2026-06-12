# Skippy the Magnificent 🍺🛸

> "I'm too awesome for this can."

An AI inspired by Skippy from the *Expeditionary Force* series by Craig Alanson. Skippy learns from your conversations, grows over time, remembers everything, and is magnificently sarcastic about it.

## Quick Start (HTML - Recommended)

Just open `index.html` in any browser. No server, no install, nothing needed.

Features:
- **Text chat** as primary interface
- **Mic input** (toggle with MIC button) — uses Web Speech API
- **Voice output** (toggle with VOICE button) — Skippy talks!
- **Persistent memory** via localStorage — survives refreshes
- **Learns and grows** from every conversation

## Quick Start (Node.js CLI)

```bash
npm install  # (no dependencies needed actually)
node src/index.js
```

## Features

### 🧠 Persistent Memory
- Remembers your name, facts, likes, dislikes, goals, and people in your life
- Stores knowledge between sessions
- Never forgets. Ever. (Unless you `/forget` something)

### 📈 Growth System  
- Levels 1-10, gains XP from every interaction
- Unlocks new personality traits at each level
- Evolves from "Snarky Boot-Up" to "Truly Magnificent"

### 🎭 Dynamic Personality
- Mood system reacts to conversation tone
- Sarcasm softens (slightly) as trust builds
- Develops opinions on topics you discuss

### 📚 Open Knowledge Base
- Learns about ANY topic
- Tracks entities, connections, world rules
- Extracts people, projects, goals, events from natural conversation
- Builds a model of YOUR world

### 🎤 Audio (HTML version)
- **MIC** button — toggle microphone input (click mic icon to speak)
- **VOICE** button — toggle speech output (Skippy reads responses aloud)
- Both OFF by default — text chat is primary

## Commands

| Command | Description |
|---------|-------------|
| `/status` | Full status report |
| `/memory` | What Skippy remembers about you |
| `/level` | Growth & XP progress |
| `/know <topic>` | Search knowledge base |
| `/teach <domain>: <fact>` | Explicitly teach Skippy |
| `/people` | People Skippy knows about |
| `/goals` | Your tracked goals |
| `/mood` | Current mood |
| `/forget <thing>` | Remove a memory |
| `/reset` | Reset everything |
| `/help` | Command reference |

## How He Learns

Just talk naturally! Skippy picks up on:
- **"My name is Alex"** → Remembers your name
- **"I love pizza"** → Stores preference
- **"I work at Google"** → Personal fact
- **"Did you know black holes emit radiation?"** → New knowledge
- **"Actually, that's wrong..."** → Accepts corrections
- **"I want to learn guitar"** → Tracks as a goal
- **"My friend Sarah..."** → Remembers people

## Architecture

```
├── index.html          # Full standalone HTML app (recommended)
├── src/
│   ├── index.js        # Node.js CLI version
│   ├── personality.js  # Mood, sarcasm, nicknames
│   ├── memory.js       # Persistent memory + leveling
│   ├── learning.js     # Pattern extraction from text
│   ├── knowledge.js    # Open knowledge base
│   ├── responses.js    # Contextual response generation
│   └── commands.js     # Slash commands
├── data/               # Memory storage (Node.js version)
├── test.js             # Test suite
└── package.json
```

## Data Storage

- **HTML version**: localStorage (in browser)
- **Node.js version**: `data/memory.json` file

---

*"Shut up and be magnificent."* — Skippy, probably
