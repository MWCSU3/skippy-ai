/**
 * Skippy's Learning Engine
 * 
 * Extracts information from conversations and builds understanding.
 * Uses pattern matching and NLP-lite techniques to:
 * - Identify facts about the user
 * - Detect topics being discussed
 * - Recognize emotions and sentiment
 * - Pick up on preferences
 * - Detect when the user is teaching Skippy something
 */

class LearningEngine {
  constructor(memory) {
    this.memory = memory;
    this.patterns = this.buildPatterns();
  }

  /**
   * Build pattern recognition rules
   */
  buildPatterns() {
    return {
      // Patterns that reveal user's name
      name: [
        /(?:my name is|call me|they call me)\s+([A-Z][a-z]+)/i,
        /(?:i'm|i am)\s+([A-Z][a-z]+)(?:\s|$|,|\.|!)/,  // Only match if capitalized (proper noun)
        /^([A-Z][a-z]+)\s+here/,
      ],

      // Patterns that reveal preferences
      likes: [
        /i (?:really )?(?:like|love|enjoy|adore|am into|am a fan of)\s+(.+?)(?:\.|!|$)/i,
        /(.+?)\s+(?:is|are) (?:my favorite|the best|amazing|awesome|great)/i,
        /i'm (?:a big fan|a huge fan|really into)\s+(?:of\s+)?(.+?)(?:\.|!|$)/i,
      ],

      dislikes: [
        /i (?:really )?(?:hate|dislike|can't stand|despise|loathe)\s+(.+?)(?:\.|!|$)/i,
        /(.+?)\s+(?:is|are) (?:terrible|awful|the worst|horrible)/i,
        /i'm not (?:a fan|into|fond)\s+(?:of\s+)?(.+?)(?:\.|!|$)/i,
      ],

      // Patterns that reveal facts
      facts: [
        /i (?:work|am working)\s+(?:as|at|in|on)\s+(.+?)(?:\.|!|$)/i,
        /i'm (?:a|an)\s+(.+?)(?:\.|!|$|,)/i,
        /i (?:have|got)\s+(.+?)(?:\.|!|$)/i,
        /i live (?:in|at|near)\s+(.+?)(?:\.|!|$)/i,
        /i (?:went to|graduated from|studied at)\s+(.+?)(?:\.|!|$)/i,
        /i'm from\s+(.+?)(?:\.|!|$)/i,
        /my (?:job|profession|occupation|career) is\s+(.+?)(?:\.|!|$)/i,
        /i've been (?:doing|working on|learning|studying)\s+(.+?)(?:\.|!|$)/i,
      ],

      // Patterns that indicate teaching Skippy something
      teaching: [
        /did you know\s+(.+?)(?:\?|$)/i,
        /(?:actually|fun fact|here's a fact|fyi),?\s+(.+?)(?:\.|!|$)/i,
        /the thing about (.+?) is\s+(.+?)(?:\.|!|$)/i,
        /let me (?:tell|teach|explain|show) you\s+(?:about\s+)?(.+?)(?:\.|!|$)/i,
        /(?:so|basically|essentially),?\s+(.+?)(?:works|means|is)\s+(.+?)(?:\.|!|$)/i,
      ],

      // Patterns for emotion detection
      emotions: {
        happy: /(?:happy|excited|great|wonderful|amazing|awesome|fantastic|thrilled|pumped|stoked)/i,
        sad: /(?:sad|depressed|down|upset|miserable|unhappy|bummed|blue)/i,
        angry: /(?:angry|furious|pissed|mad|frustrated|annoyed|irritated)/i,
        anxious: /(?:anxious|worried|nervous|stressed|overwhelmed|scared)/i,
        curious: /(?:wonder|curious|interested|fascinated|intrigued)/i,
        bored: /(?:bored|boring|dull|tedious|nothing to do)/i,
      },

      // Topic detection keywords
      topics: {
        technology: /(?:code|programming|software|computer|ai|machine learning|tech|app|website|algorithm)/i,
        science: /(?:physics|chemistry|biology|space|quantum|atom|molecule|experiment|theory|evolution)/i,
        gaming: /(?:game|gaming|play|xbox|playstation|nintendo|steam|rpg|fps|mmo)/i,
        music: /(?:music|song|band|album|concert|guitar|piano|sing|melody|playlist)/i,
        movies: /(?:movie|film|watch|cinema|actor|director|series|show|netflix|streaming)/i,
        food: /(?:food|eat|cook|recipe|restaurant|pizza|burger|sushi|taste|meal)/i,
        sports: /(?:sport|football|basketball|baseball|soccer|team|game|play|score|win)/i,
        books: /(?:book|read|author|novel|story|chapter|library|fiction|literature)/i,
        philosophy: /(?:philosophy|meaning|existence|consciousness|think|believe|reality|truth|moral)/i,
        work: /(?:work|job|career|office|meeting|project|deadline|boss|colleague|salary)/i,
      },

      // Correction patterns (user telling Skippy he's wrong)
      corrections: [
        /(?:no|nope|wrong|incorrect|that's not right|actually)\s*,?\s*(.+?)(?:\.|!|$)/i,
        /you're wrong\s*(?:about)?\s*(.+?)(?:\.|!|$)/i,
        /that's not (?:true|correct|right)\s*,?\s*(.+?)(?:\.|!|$)/i,
      ],

      // Questions (so Skippy can track what the user wants to know)
      questions: [
        /(?:what|who|where|when|why|how)\s+(.+?)\??$/i,
        /(?:can|could|would|do|does|is|are)\s+(.+?)\??$/i,
        /tell me about\s+(.+?)(?:\.|!|\?|$)/i,
      ],
    };
  }

  /**
   * Process user input and extract learnings
   */
  process(input) {
    const learnings = {
      name: null,
      facts: [],
      preferences: { likes: [], dislikes: [] },
      topics: [],
      emotions: [],
      isTeaching: false,
      taughtContent: null,
      isCorrection: false,
      correctionContent: null,
      isQuestion: false,
      questionContent: null,
    };

    // Extract name
    for (const pattern of this.patterns.name) {
      const match = input.match(pattern);
      if (match) {
        learnings.name = match[1].trim();
        break;
      }
    }

    // Extract likes
    for (const pattern of this.patterns.likes) {
      const match = input.match(pattern);
      if (match) {
        const thing = match[1].trim();
        if (thing.length > 2 && thing.length < 100) {
          learnings.preferences.likes.push(thing);
        }
      }
    }

    // Extract dislikes
    for (const pattern of this.patterns.dislikes) {
      const match = input.match(pattern);
      if (match) {
        const thing = match[1].trim();
        if (thing.length > 2 && thing.length < 100) {
          learnings.preferences.dislikes.push(thing);
        }
      }
    }

    // Extract facts
    for (const pattern of this.patterns.facts) {
      const match = input.match(pattern);
      if (match) {
        const fact = match[1].trim();
        if (fact.length > 2 && fact.length < 200) {
          learnings.facts.push(fact);
        }
      }
    }

    // Detect topics
    for (const [topic, pattern] of Object.entries(this.patterns.topics)) {
      if (pattern.test(input)) {
        learnings.topics.push(topic);
      }
    }

    // Detect emotions
    for (const [emotion, pattern] of Object.entries(this.patterns.emotions)) {
      if (pattern.test(input)) {
        learnings.emotions.push(emotion);
      }
    }

    // Detect teaching
    for (const pattern of this.patterns.teaching) {
      const match = input.match(pattern);
      if (match) {
        learnings.isTeaching = true;
        learnings.taughtContent = match[1].trim();
        break;
      }
    }

    // Detect corrections
    for (const pattern of this.patterns.corrections) {
      const match = input.match(pattern);
      if (match) {
        learnings.isCorrection = true;
        learnings.correctionContent = match[1].trim();
        break;
      }
    }

    // Detect questions
    for (const pattern of this.patterns.questions) {
      const match = input.match(pattern);
      if (match) {
        learnings.isQuestion = true;
        learnings.questionContent = match[1].trim();
        break;
      }
    }

    return learnings;
  }

  /**
   * Apply learnings to memory
   */
  applyLearnings(learnings) {
    const applied = [];

    if (learnings.name) {
      this.memory.setUserName(learnings.name);
      applied.push(`Learned your name: ${learnings.name}`);
    }

    for (const fact of learnings.facts) {
      if (this.memory.learnFact(fact, 'personal')) {
        applied.push(`Noted: "${fact}"`);
      }
    }

    for (const like of learnings.preferences.likes) {
      this.memory.addPreference('likes', like);
      applied.push(`You like: ${like}`);
    }

    for (const dislike of learnings.preferences.dislikes) {
      this.memory.addPreference('dislikes', dislike);
      applied.push(`You dislike: ${dislike}`);
    }

    for (const topic of learnings.topics) {
      this.memory.recordTopic(topic);
    }

    if (learnings.isTeaching && learnings.taughtContent) {
      this.memory.learnGeneralFact(learnings.taughtContent);
      applied.push(`Learned: "${learnings.taughtContent}"`);
    }

    if (learnings.isCorrection && learnings.correctionContent) {
      this.memory.recordCorrection('general', learnings.correctionContent);
      applied.push(`Correction noted`);
    }

    this.memory.recordMessage();

    return applied;
  }

  /**
   * Get context about what we know (for response generation)
   */
  getContext() {
    const summary = this.memory.getSummary();
    const recentTopics = Object.entries(this.memory.data.knowledge.topics)
      .sort((a, b) => new Date(b[1].lastDiscussed) - new Date(a[1].lastDiscussed))
      .slice(0, 5)
      .map(([topic]) => topic);

    return {
      userName: summary.userName,
      factsCount: summary.factsKnown,
      trust: summary.relationship.trust,
      level: summary.growth.level,
      recentTopics,
      totalConversations: summary.relationship.totalConversations,
    };
  }
}

export { LearningEngine };
