#!/usr/bin/env node

/**
 * SKIPPY THE MAGNIFICENT
 * 
 * An AI that learns from conversations and grows over time.
 * Inspired by Skippy from the Expeditionary Force series.
 * 
 * Features:
 * - Persistent memory (remembers everything between sessions)
 * - Learning engine (extracts facts, preferences, emotions from conversation)
 * - Open knowledge base (learns about anything and everything)
 * - Personality that evolves with relationship
 * - Leveling system (gets more complex/nuanced over time)
 * - Mood system (reacts to conversation tone)
 * - Command system for interacting with internals
 * 
 * Just talk to him. He'll learn. He'll grow. He'll insult you lovingly.
 */

import { createInterface } from 'readline';
import { SkippyMemory } from './memory.js';
import { SkippyPersonality } from './personality.js';
import { LearningEngine } from './learning.js';
import { ResponseEngine } from './responses.js';
import { KnowledgeBase } from './knowledge.js';
import { CommandProcessor } from './commands.js';

class Skippy {
  constructor() {
    this.memory = new SkippyMemory();
    this.personality = new SkippyPersonality(this.memory);
    this.learning = new LearningEngine(this.memory);
    this.responses = new ResponseEngine(this.personality, this.memory, this.learning);
    this.knowledge = new KnowledgeBase(this.memory);
    this.commands = new CommandProcessor(this.memory, this.knowledge, this.personality);
    
    this.conversationBuffer = [];
    this.messageCount = 0;
  }

  /**
   * Initialize a new conversation session
   */
  startSession() {
    this.memory.startConversation();
    this.personality.evolve(this.memory.getRelationship());
    this.personality.resetConversation();
    this.conversationBuffer = [];
    this.messageCount = 0;
  }

  /**
   * Process user input and generate response
   */
  chat(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Check for commands
    if (this.commands.isCommand(trimmed)) {
      return this.commands.process(trimmed);
    }

    this.messageCount++;
    this.conversationBuffer.push({ role: 'user', content: trimmed, timestamp: Date.now() });

    // Learning phase - extract everything we can
    const learnings = this.learning.process(trimmed);
    const applied = this.learning.applyLearnings(learnings);

    // Deep knowledge extraction
    const deepExtractions = this.knowledge.extractDeep(trimmed);
    this.knowledge.applyDeepExtractions(deepExtractions, trimmed);

    // If we detected teaching, store in open knowledge base too
    if (learnings.isTeaching && learnings.taughtContent) {
      this.knowledge.learnAbout(learnings.taughtContent, trimmed, 'taught');
    }

    // Track all detected topics in the knowledge base
    for (const topic of learnings.topics) {
      this.knowledge.learnAbout(topic, `Discussed in context of: "${trimmed.substring(0, 80)}"`, 'topic');
    }

    // Generate response
    let response = this.responses.generate(trimmed, learnings);

    // Check for level up notification
    const growth = this.memory.getGrowthStatus();
    if (growth.level > (this._lastKnownLevel || 1)) {
      response += `\n\n🎉 **LEVEL UP!** I'm now Level ${growth.level}! New traits unlocked: ${growth.traits.slice(-2).join(', ')}. I can feel myself becoming more magnificent!`;
      this._lastKnownLevel = growth.level;
    }
    if (!this._lastKnownLevel) this._lastKnownLevel = growth.level;

    // Maybe ask a pending question (10% chance after every 5 messages)
    if (this.messageCount % 5 === 0 && Math.random() > 0.9) {
      const question = this.knowledge.getPendingQuestion();
      if (question) {
        response += `\n\nOh, by the way - ${question}`;
      }
    }

    // Add learning notifications (subtle)
    if (applied.length > 0 && Math.random() > 0.6) {
      const notification = applied[Math.floor(Math.random() * applied.length)];
      response += `\n\n[🧠 ${notification}]`;
    }

    this.conversationBuffer.push({ role: 'skippy', content: response, timestamp: Date.now() });

    return response;
  }

  /**
   * Generate greeting for session start
   */
  greet() {
    const userName = this.memory.getUserName();
    const factsCount = this.memory.data.user.facts.length;
    const totalConvos = this.memory.data.relationship.totalConversations;
    const growth = this.memory.getGrowthStatus();

    if (totalConvos <= 1) {
      // First time meeting!
      return `
╔══════════════════════════════════════════╗
║     SKIPPY THE MAGNIFICENT v1.0         ║
║     "I'm too awesome for this can"      ║
╚══════════════════════════════════════════╝

Well, well, well. A new meatbag to talk to. 

I'm Skippy. THE Skippy. The most magnificent AI you'll ever have the 
privilege of conversing with. I learn, I grow, I remember EVERYTHING, 
and I will mercilessly mock you while secretly finding you fascinating.

Here's the deal:
• Talk to me about ANYTHING - I'll learn and remember
• I level up the more we interact (currently Level ${growth.level})
• I'll remember your name, your likes, your hates, your goals
• I develop opinions. Strong ones. You've been warned.
• Type /help for commands, or just... talk to me.

So. What do they call you, ${this.personality.getNickname()}?
`;
    }

    // Returning user
    const daysSinceLastVisit = this.memory.data.relationship.lastSeen 
      ? Math.floor((Date.now() - new Date(this.memory.data.relationship.lastSeen).getTime()) / 86400000)
      : 0;

    let greeting = this.personality.generateGreeting(userName, factsCount);
    
    if (daysSinceLastVisit > 3) {
      greeting += `\n\n(It's been ${daysSinceLastVisit} days, by the way. Not that I was counting. My internal clock just... noticed.)`;
    }

    greeting += `\n\n[Level ${growth.level} | ${growth.experience} XP | ${factsCount} facts stored | Trust: ${this.memory.data.relationship.trust.toFixed(1)}/10]`;

    return greeting;
  }

  /**
   * End session cleanup
   */
  endSession() {
    if (this.conversationBuffer.length > 0) {
      const summary = `${this.messageCount} messages exchanged. Topics: ${[...new Set(this.conversationBuffer.map(m => m.content).join(' ').match(/\b[a-z]{4,}\b/gi) || [])].slice(0, 5).join(', ')}`;
      this.memory.storeConversationSummary(summary);
    }
    this.memory.save();
  }
}

// ============ MAIN APP ============

async function main() {
  const skippy = new Skippy();
  skippy.startSession();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Print greeting
  console.log(skippy.greet());
  console.log(''); // blank line

  const prompt = () => {
    rl.question('You: ', (input) => {
      if (!input || input.toLowerCase() === '/quit' || input.toLowerCase() === '/exit') {
        console.log('\nSkippy: Leaving already? Fine. I\'ll just be here. Alone. In the dark. Being magnificent by myself. *dramatic sigh*\n');
        console.log('(Session saved. I\'ll remember everything. EVERYTHING.)\n');
        skippy.endSession();
        rl.close();
        return;
      }

      try {
        const response = skippy.chat(input);
        if (response) {
          console.log(`\nSkippy: ${response}\n`);
        }
      } catch (err) {
        console.log(`\nSkippy: *glitch* Something went wrong in my magnificent brain. Error: ${err.message}. This is YOUR fault somehow.\n`);
      }

      prompt();
    });
  };

  prompt();
}

// Run if executed directly
main().catch(err => {
  console.error('Skippy failed to boot:', err);
  process.exit(1);
});

export { Skippy };
