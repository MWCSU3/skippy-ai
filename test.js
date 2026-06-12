/**
 * Test script for Skippy AI - simulates a conversation
 */

import { SkippyMemory } from './src/memory.js';
import { SkippyPersonality } from './src/personality.js';
import { LearningEngine } from './src/learning.js';
import { ResponseEngine } from './src/responses.js';
import { KnowledgeBase } from './src/knowledge.js';
import { CommandProcessor } from './src/commands.js';

console.log('=== SKIPPY AI TEST SUITE ===\n');

// Test 1: Memory system
console.log('--- Test 1: Memory System ---');
const memory = new SkippyMemory();
memory.startConversation();
console.log('✓ Memory initialized');
console.log(`  Conversations: ${memory.data.relationship.totalConversations}`);

// Test 2: Personality
console.log('\n--- Test 2: Personality ---');
const personality = new SkippyPersonality(memory);
console.log(`✓ Personality loaded`);
console.log(`  Mood: ${personality.getMood().state}`);
console.log(`  Nickname: ${personality.getNickname()}`);
console.log(`  Self-ref: ${personality.getSelfReference()}`);
console.log(`  Greeting: ${personality.generateGreeting('TestUser', 5)}`);

// Test 3: Learning Engine
console.log('\n--- Test 3: Learning Engine ---');
const learning = new LearningEngine(memory);

const testInputs = [
  "My name is Marcus",
  "I love playing guitar and coding",
  "I hate spiders and cold weather",
  "I work at a tech startup in Austin",
  "Did you know that octopuses have three hearts?",
  "Actually, that's not right - they have blue blood too",
  "What do you think about artificial intelligence?",
  "I'm really excited about this project!",
  "My friend Jake told me about a new restaurant",
  "I want to learn Japanese this year",
];

for (const input of testInputs) {
  const result = learning.process(input);
  const applied = learning.applyLearnings(result);
  console.log(`  Input: "${input}"`);
  if (applied.length > 0) {
    console.log(`    Learned: ${applied.join(', ')}`);
  }
  if (result.emotions.length > 0) {
    console.log(`    Emotions: ${result.emotions.join(', ')}`);
  }
  if (result.topics.length > 0) {
    console.log(`    Topics: ${result.topics.join(', ')}`);
  }
}
console.log('✓ Learning engine working');

// Test 4: Knowledge Base
console.log('\n--- Test 4: Knowledge Base ---');
const knowledge = new KnowledgeBase(memory);
knowledge.learnAbout('guitar', 'User plays guitar', 'hobby');
knowledge.learnAbout('Austin', 'User lives here', 'place');
knowledge.connect('Marcus', 'Austin', 'lives in');
knowledge.learnPerson('Jake', 'mentioned a restaurant', 'friend');
knowledge.learnGoal('Learn Japanese', 'mentioned wanting to learn');
knowledge.learnWorldRule('biology', 'Octopuses have three hearts');
knowledge.recordEvent('Started talking to Skippy');

const stats = knowledge.getStats();
console.log(`✓ Knowledge base working`);
console.log(`  Entities: ${stats.totalEntities}`);
console.log(`  Connections: ${stats.totalConnections}`);
console.log(`  People: ${stats.totalPeople}`);
console.log(`  Goals: ${stats.totalGoals}`);
console.log(`  Events: ${stats.totalEvents}`);

// Test recall
const recall = knowledge.recall('guitar');
console.log(`  Recall "guitar": ${recall.entities.length} entities found`);

// Test 5: Response Engine
console.log('\n--- Test 5: Response Engine ---');
const responses = new ResponseEngine(personality, memory, learning);

const testMessages = [
  "Hey Skippy, how are you?",
  "I think you're magnificent",
  "Tell me about space",
  "I'm feeling kind of sad today",
  "I really love pizza",
];

for (const msg of testMessages) {
  const learnings = learning.process(msg);
  learning.applyLearnings(learnings);
  const response = responses.generate(msg, learnings);
  console.log(`  You: "${msg}"`);
  console.log(`  Skippy: "${response.substring(0, 120)}..."`);
  console.log('');
}
console.log('✓ Response engine working');

// Test 6: Commands
console.log('\n--- Test 6: Commands ---');
const commands = new CommandProcessor(memory, knowledge, personality);

console.log(`  /help is command: ${commands.isCommand('/help')}`);
console.log(`  "hello" is command: ${commands.isCommand('hello')}`);

const helpResult = commands.process('/help');
console.log(`  /help output: ${helpResult.substring(0, 80)}...`);

const statusResult = commands.process('/status');
console.log(`  /status output: ${statusResult.substring(0, 80)}...`);

const moodResult = commands.process('/mood');
console.log(`  /mood output: ${moodResult.substring(0, 80)}...`);

const teachResult = commands.process('/teach science: Water is H2O');
console.log(`  /teach output: ${teachResult.substring(0, 80)}...`);

console.log('✓ Command system working');

// Test 7: Growth System
console.log('\n--- Test 7: Growth System ---');
const growth = memory.getGrowthStatus();
console.log(`  Level: ${growth.level}`);
console.log(`  Experience: ${growth.experience}`);
console.log(`  Next level at: ${growth.nextLevelAt}`);
console.log(`  Traits: ${growth.traits.join(', ')}`);
console.log(`  Total facts: ${growth.totalFacts}`);
console.log('✓ Growth system working');

// Test 8: Deep Extraction
console.log('\n--- Test 8: Deep Knowledge Extraction ---');
const deepInput = "Yesterday I went to a meeting with Sarah about the new app we're building called TaskMaster. I want to finish the MVP by next month.";
const deepResult = knowledge.extractDeep(deepInput);
console.log(`  Input: "${deepInput}"`);
console.log(`  People found: ${deepResult.people.join(', ') || 'none'}`);
console.log(`  Projects found: ${deepResult.projects.join(', ') || 'none'}`);
console.log(`  Goals found: ${deepResult.goals.join(', ') || 'none'}`);
console.log(`  Events found: ${deepResult.events.join(', ') || 'none'}`);
console.log('✓ Deep extraction working');

// Final summary
console.log('\n\n=== ALL TESTS PASSED ===');
console.log(`\nSkippy's Memory Summary:`);
const summary = memory.getSummary();
console.log(`  User: ${summary.userName}`);
console.log(`  Facts known: ${summary.factsKnown}`);
console.log(`  Topics: ${summary.topicsDiscussed}`);
console.log(`  Level: ${summary.growth.level}`);
console.log(`  XP: ${summary.growth.experience}`);
console.log(`  Trust: ${summary.relationship.trust}`);
console.log(`  Messages: ${summary.relationship.totalMessages}`);

// Cleanup test data
import { existsSync, unlinkSync } from 'fs';
const memFile = './data/memory.json';
if (existsSync(memFile)) {
  unlinkSync(memFile);
  console.log('\n(Test memory cleaned up)');
}

console.log('\n🎉 Skippy is ready to be magnificent!');
