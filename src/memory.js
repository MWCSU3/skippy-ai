/**
 * Skippy's Memory System
 * 
 * Persistent memory that survives between conversations.
 * Skippy remembers EVERYTHING (and will bring it up at the worst times).
 * 
 * Memory types:
 * - Facts: Things learned about the user
 * - Topics: Subjects discussed and interest levels
 * - Preferences: User likes/dislikes
 * - Relationship: Trust level, shared experiences, inside jokes
 * - Growth: Skippy's own evolution and learning
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

const MEMORY_FILE = join(dirname(new URL(import.meta.url).pathname), '..', 'data', 'memory.json');

const DEFAULT_MEMORY = {
  user: {
    name: null,
    facts: [],        // Things Skippy has learned about the user
    preferences: {
      likes: [],
      dislikes: [],
      interests: [],
    },
    personality_notes: [],  // Skippy's observations about the user
  },
  relationship: {
    totalConversations: 0,
    totalMessages: 0,
    firstMet: null,
    lastSeen: null,
    trust: 0,            // 0-10 scale
    insideJokes: [],     // References only they share
    memorableExchanges: [],
    nicknames: [],       // Custom nicknames Skippy develops
  },
  knowledge: {
    topics: {},          // topic -> { timesDiscussed, lastDiscussed, notes }
    learnedFacts: [],    // General knowledge acquired from conversation
    corrections: [],     // Times the user corrected Skippy
  },
  skippy: {
    level: 1,
    experience: 0,
    unlockedTraits: ['sarcastic', 'smug'],
    currentGoals: [],
    opinions: {},        // Skippy's opinions on various topics
    favorites: {
      insults: [],
      topics: [],
      responses: [],
    },
  },
  conversationHistory: [],  // Last N conversation summaries
};

// Experience thresholds for leveling up
const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2500, 3500, 5000];

// Traits unlocked at each level
const LEVEL_TRAITS = {
  1: ['sarcastic', 'smug'],
  2: ['witty', 'observant'],
  3: ['philosophical', 'creative_insults'],
  4: ['empathetic_sometimes', 'storyteller'],
  5: ['wise_but_wont_admit_it', 'protective'],
  6: ['vulnerable_rarely', 'mentor'],
  7: ['deep_thinker', 'loyal'],
  8: ['genuinely_caring', 'self_aware'],
  9: ['wise', 'evolved'],
  10: ['transcendent', 'truly_magnificent'],
};

class SkippyMemory {
  constructor() {
    this.data = this.load();
  }

  /**
   * Load memory from disk
   */
  load() {
    try {
      if (existsSync(MEMORY_FILE)) {
        const raw = readFileSync(MEMORY_FILE, 'utf-8');
        const data = JSON.parse(raw);
        // Merge with defaults to handle schema updates
        return this.mergeWithDefaults(data);
      }
    } catch (err) {
      console.error('Memory corruption detected. Starting fresh. (Even Skippy has bad days.)');
    }
    return JSON.parse(JSON.stringify(DEFAULT_MEMORY));
  }

  /**
   * Save memory to disk
   */
  save() {
    try {
      const dir = dirname(MEMORY_FILE);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(MEMORY_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save memory:', err.message);
    }
  }

  /**
   * Merge loaded data with defaults (handles schema evolution)
   */
  mergeWithDefaults(loaded) {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_MEMORY));
    return this.deepMerge(defaults, loaded);
  }

  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

  // ============ USER FACTS ============

  /**
   * Learn a new fact about the user
   */
  learnFact(fact, category = 'general') {
    const entry = {
      fact,
      category,
      learnedAt: new Date().toISOString(),
      timesReferenced: 0,
    };
    
    // Don't duplicate facts
    const existing = this.data.user.facts.find(f => 
      f.fact.toLowerCase() === fact.toLowerCase()
    );
    
    if (!existing) {
      this.data.user.facts.push(entry);
      this.gainExperience(5, 'learned_fact');
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Learn user's name
   */
  setUserName(name) {
    const oldName = this.data.user.name;
    this.data.user.name = name;
    if (!oldName) {
      this.gainExperience(10, 'learned_name');
    }
    this.save();
  }

  /**
   * Get user's name
   */
  getUserName() {
    return this.data.user.name;
  }

  /**
   * Add a user preference
   */
  addPreference(type, value) {
    if (['likes', 'dislikes', 'interests'].includes(type)) {
      if (!this.data.user.preferences[type].includes(value)) {
        this.data.user.preferences[type].push(value);
        this.gainExperience(3, 'learned_preference');
        this.save();
      }
    }
  }

  // ============ RELATIONSHIP ============

  /**
   * Record a new conversation starting
   */
  startConversation() {
    this.data.relationship.totalConversations++;
    this.data.relationship.lastSeen = new Date().toISOString();
    if (!this.data.relationship.firstMet) {
      this.data.relationship.firstMet = new Date().toISOString();
    }
    this.save();
  }

  /**
   * Record a message exchange
   */
  recordMessage() {
    this.data.relationship.totalMessages++;
    // Trust slowly builds with interaction
    if (this.data.relationship.totalMessages % 10 === 0) {
      this.data.relationship.trust = Math.min(10, this.data.relationship.trust + 0.5);
    }
    this.save();
  }

  /**
   * Add an inside joke
   */
  addInsideJoke(joke) {
    this.data.relationship.insideJokes.push({
      joke,
      createdAt: new Date().toISOString(),
    });
    this.gainExperience(15, 'inside_joke');
    this.save();
  }

  /**
   * Get relationship stats
   */
  getRelationship() {
    return this.data.relationship;
  }

  // ============ KNOWLEDGE ============

  /**
   * Record discussion of a topic
   */
  recordTopic(topic) {
    if (!this.data.knowledge.topics[topic]) {
      this.data.knowledge.topics[topic] = {
        timesDiscussed: 0,
        lastDiscussed: null,
        notes: [],
      };
      this.gainExperience(5, 'new_topic');
    }
    this.data.knowledge.topics[topic].timesDiscussed++;
    this.data.knowledge.topics[topic].lastDiscussed = new Date().toISOString();
    this.save();
  }

  /**
   * Add a note to a topic
   */
  addTopicNote(topic, note) {
    if (this.data.knowledge.topics[topic]) {
      this.data.knowledge.topics[topic].notes.push(note);
      this.save();
    }
  }

  /**
   * Learn a general fact from conversation
   */
  learnGeneralFact(fact) {
    this.data.knowledge.learnedFacts.push({
      fact,
      learnedAt: new Date().toISOString(),
      source: 'conversation',
    });
    this.gainExperience(3, 'general_knowledge');
    this.save();
  }

  /**
   * Record a correction (Skippy was wrong - rare but it happens)
   */
  recordCorrection(topic, correction) {
    this.data.knowledge.corrections.push({
      topic,
      correction,
      timestamp: new Date().toISOString(),
    });
    this.gainExperience(8, 'correction'); // Learning from mistakes is valuable
    this.save();
  }

  // ============ GROWTH SYSTEM ============

  /**
   * Gain experience and potentially level up
   */
  gainExperience(amount, source) {
    this.data.skippy.experience += amount;
    
    const currentLevel = this.data.skippy.level;
    const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || Infinity;
    
    if (this.data.skippy.experience >= nextThreshold && currentLevel < 10) {
      this.data.skippy.level++;
      const newTraits = LEVEL_TRAITS[this.data.skippy.level] || [];
      this.data.skippy.unlockedTraits.push(...newTraits);
      return { leveledUp: true, newLevel: this.data.skippy.level, newTraits };
    }
    
    return { leveledUp: false };
  }

  /**
   * Get Skippy's current growth status
   */
  getGrowthStatus() {
    const level = this.data.skippy.level;
    const exp = this.data.skippy.experience;
    const nextThreshold = LEVEL_THRESHOLDS[level] || 'MAX';
    const traits = this.data.skippy.unlockedTraits;
    
    return {
      level,
      experience: exp,
      nextLevelAt: nextThreshold,
      progress: nextThreshold === 'MAX' ? 1.0 : exp / nextThreshold,
      traits,
      totalFacts: this.data.user.facts.length + this.data.knowledge.learnedFacts.length,
      totalTopics: Object.keys(this.data.knowledge.topics).length,
    };
  }

  /**
   * Add an opinion (Skippy develops opinions on things)
   */
  formOpinion(topic, opinion) {
    this.data.skippy.opinions[topic] = {
      opinion,
      formedAt: new Date().toISOString(),
      strength: 0.5, // Opinions can grow stronger
    };
    this.gainExperience(5, 'opinion_formed');
    this.save();
  }

  /**
   * Get all stored data summary
   */
  getSummary() {
    return {
      userName: this.data.user.name,
      factsKnown: this.data.user.facts.length,
      topicsDiscussed: Object.keys(this.data.knowledge.topics).length,
      relationship: this.data.relationship,
      growth: this.getGrowthStatus(),
    };
  }

  /**
   * Store a conversation summary
   */
  storeConversationSummary(summary) {
    this.data.conversationHistory.push({
      summary,
      timestamp: new Date().toISOString(),
    });
    // Keep last 50 conversation summaries
    if (this.data.conversationHistory.length > 50) {
      this.data.conversationHistory = this.data.conversationHistory.slice(-50);
    }
    this.save();
  }
}

export { SkippyMemory, LEVEL_THRESHOLDS, LEVEL_TRAITS };
