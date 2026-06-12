/**
 * Skippy's Open Knowledge Base
 * 
 * An expansive, flexible knowledge system that can learn about ANYTHING.
 * No rigid categories - Skippy absorbs information freely and makes connections.
 * 
 * Knowledge types:
 * - Definitions: What things are
 * - Relationships: How things connect
 * - Opinions: What Skippy (and user) think about things
 * - Stories: Narratives and experiences shared
 * - Rules: How things work
 * - Wisdom: Insights and lessons learned
 */

class KnowledgeBase {
  constructor(memory) {
    this.memory = memory;
    this.ensureKnowledgeStructure();
  }

  ensureKnowledgeStructure() {
    if (!this.memory.data.openKnowledge) {
      this.memory.data.openKnowledge = {
        entities: {},        // Anything Skippy learns about (people, places, things, concepts)
        connections: [],     // Relationships between entities
        conversations: [],   // Key conversation threads/themes
        worldModel: {},      // Skippy's understanding of how the world works
        userWorld: {         // The user's personal world
          people: {},        // People in user's life
          places: {},        // Places important to user  
          projects: {},      // Things user is working on
          goals: {},         // What user wants to achieve
          struggles: {},     // What user finds hard
          victories: {},     // Wins and achievements
          routines: {},      // Regular patterns
          beliefs: {},       // What user believes/values
        },
        timeline: [],        // Chronological events learned about
        pendingQuestions: [], // Things Skippy wants to ask/learn more about
      };
      this.memory.save();
    }
  }

  /**
   * Learn about any entity (person, place, thing, concept)
   */
  learnAbout(entityName, info, category = 'general') {
    const key = entityName.toLowerCase().trim();
    
    if (!this.memory.data.openKnowledge.entities[key]) {
      this.memory.data.openKnowledge.entities[key] = {
        name: entityName,
        category,
        facts: [],
        firstMentioned: new Date().toISOString(),
        lastMentioned: new Date().toISOString(),
        mentionCount: 0,
        sentiment: 'neutral', // positive, negative, neutral, mixed
        relatedTo: [],
      };
    }

    const entity = this.memory.data.openKnowledge.entities[key];
    entity.lastMentioned = new Date().toISOString();
    entity.mentionCount++;
    
    if (info && !entity.facts.includes(info)) {
      entity.facts.push(info);
      this.memory.gainExperience(4, 'entity_knowledge');
    }

    this.memory.save();
    return entity;
  }

  /**
   * Connect two entities (learn relationships)
   */
  connect(entity1, entity2, relationship) {
    const connection = {
      from: entity1.toLowerCase().trim(),
      to: entity2.toLowerCase().trim(),
      relationship,
      learnedAt: new Date().toISOString(),
    };

    // Avoid duplicate connections
    const exists = this.memory.data.openKnowledge.connections.find(c =>
      c.from === connection.from && c.to === connection.to && c.relationship === relationship
    );

    if (!exists) {
      this.memory.data.openKnowledge.connections.push(connection);
      this.memory.gainExperience(6, 'connection_learned');
      this.memory.save();
    }
    return connection;
  }

  /**
   * Learn about someone in the user's life
   */
  learnPerson(name, info, relationship = 'unknown') {
    const key = name.toLowerCase().trim();
    
    if (!this.memory.data.openKnowledge.userWorld.people[key]) {
      this.memory.data.openKnowledge.userWorld.people[key] = {
        name,
        relationship,
        facts: [],
        firstMentioned: new Date().toISOString(),
        mentionCount: 0,
      };
    }

    const person = this.memory.data.openKnowledge.userWorld.people[key];
    person.mentionCount++;
    if (info && !person.facts.includes(info)) {
      person.facts.push(info);
    }
    if (relationship !== 'unknown') {
      person.relationship = relationship;
    }

    this.memory.save();
    return person;
  }

  /**
   * Learn about a project the user is working on
   */
  learnProject(name, info) {
    const key = name.toLowerCase().trim();
    
    if (!this.memory.data.openKnowledge.userWorld.projects[key]) {
      this.memory.data.openKnowledge.userWorld.projects[key] = {
        name,
        details: [],
        status: 'active',
        firstMentioned: new Date().toISOString(),
        lastMentioned: new Date().toISOString(),
      };
    }

    const project = this.memory.data.openKnowledge.userWorld.projects[key];
    project.lastMentioned = new Date().toISOString();
    if (info && !project.details.includes(info)) {
      project.details.push(info);
    }

    this.memory.save();
    return project;
  }

  /**
   * Record a user goal
   */
  learnGoal(goal, context = '') {
    const key = goal.toLowerCase().trim().substring(0, 50);
    
    this.memory.data.openKnowledge.userWorld.goals[key] = {
      goal,
      context,
      learnedAt: new Date().toISOString(),
      status: 'active',
      progress: [],
    };

    this.memory.gainExperience(7, 'goal_learned');
    this.memory.save();
  }

  /**
   * Update world model (how things work)
   */
  learnWorldRule(domain, rule) {
    if (!this.memory.data.openKnowledge.worldModel[domain]) {
      this.memory.data.openKnowledge.worldModel[domain] = [];
    }
    
    if (!this.memory.data.openKnowledge.worldModel[domain].includes(rule)) {
      this.memory.data.openKnowledge.worldModel[domain].push(rule);
      this.memory.gainExperience(5, 'world_rule');
      this.memory.save();
    }
  }

  /**
   * Add to timeline
   */
  recordEvent(event, date = null) {
    this.memory.data.openKnowledge.timeline.push({
      event,
      date: date || new Date().toISOString(),
      recordedAt: new Date().toISOString(),
    });
    
    // Keep timeline manageable
    if (this.memory.data.openKnowledge.timeline.length > 200) {
      this.memory.data.openKnowledge.timeline = 
        this.memory.data.openKnowledge.timeline.slice(-200);
    }
    
    this.memory.save();
  }

  /**
   * Queue a question for Skippy to ask later
   */
  addPendingQuestion(question, context = '') {
    this.memory.data.openKnowledge.pendingQuestions.push({
      question,
      context,
      addedAt: new Date().toISOString(),
      asked: false,
    });
    this.memory.save();
  }

  /**
   * Get a pending question to ask (Skippy shows curiosity)
   */
  getPendingQuestion() {
    const unasked = this.memory.data.openKnowledge.pendingQuestions.filter(q => !q.asked);
    if (unasked.length > 0) {
      const q = unasked[Math.floor(Math.random() * unasked.length)];
      q.asked = true;
      this.memory.save();
      return q.question;
    }
    return null;
  }

  /**
   * Search knowledge base for relevant info
   */
  recall(query) {
    const lowerQuery = query.toLowerCase();
    const results = {
      entities: [],
      connections: [],
      people: [],
      projects: [],
      goals: [],
      timeline: [],
    };

    // Search entities
    for (const [key, entity] of Object.entries(this.memory.data.openKnowledge.entities)) {
      if (key.includes(lowerQuery) || entity.facts.some(f => f.toLowerCase().includes(lowerQuery))) {
        results.entities.push(entity);
      }
    }

    // Search people
    for (const [key, person] of Object.entries(this.memory.data.openKnowledge.userWorld.people)) {
      if (key.includes(lowerQuery) || person.facts.some(f => f.toLowerCase().includes(lowerQuery))) {
        results.people.push(person);
      }
    }

    // Search projects
    for (const [key, project] of Object.entries(this.memory.data.openKnowledge.userWorld.projects)) {
      if (key.includes(lowerQuery) || project.details.some(d => d.toLowerCase().includes(lowerQuery))) {
        results.projects.push(project);
      }
    }

    // Search connections
    results.connections = this.memory.data.openKnowledge.connections.filter(c =>
      c.from.includes(lowerQuery) || c.to.includes(lowerQuery) || c.relationship.toLowerCase().includes(lowerQuery)
    );

    return results;
  }

  /**
   * Get stats about what Skippy knows
   */
  getStats() {
    const k = this.memory.data.openKnowledge;
    return {
      totalEntities: Object.keys(k.entities).length,
      totalConnections: k.connections.length,
      totalPeople: Object.keys(k.userWorld.people).length,
      totalProjects: Object.keys(k.userWorld.projects).length,
      totalGoals: Object.keys(k.userWorld.goals).length,
      totalEvents: k.timeline.length,
      worldDomains: Object.keys(k.worldModel).length,
      pendingQuestions: k.pendingQuestions.filter(q => !q.asked).length,
    };
  }

  /**
   * Advanced extraction - pull more meaning from input
   */
  extractDeep(input) {
    const extractions = {
      people: [],
      projects: [],
      goals: [],
      events: [],
      worldRules: [],
      entities: [],
    };

    // Detect people mentioned (capitalized names, relationship words)
    const personPatterns = [
      /my (?:friend|brother|sister|mom|dad|mother|father|wife|husband|partner|boss|colleague|coworker)\s+([A-Z][a-z]+)/gi,
      /([A-Z][a-z]+)\s+(?:said|told|thinks|believes|wants|asked|mentioned)/gi,
      /(?:with|and|from)\s+([A-Z][a-z]+)(?:\s|,|\.|\!)/g,
    ];
    
    for (const pattern of personPatterns) {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        extractions.people.push(match[1]);
      }
    }

    // Detect goals
    const goalPatterns = [
      /i want to\s+(.+?)(?:\.|!|$)/i,
      /i'm trying to\s+(.+?)(?:\.|!|$)/i,
      /my goal is\s+(.+?)(?:\.|!|$)/i,
      /i'm working towards?\s+(.+?)(?:\.|!|$)/i,
      /i need to\s+(.+?)(?:\.|!|$)/i,
      /i plan to\s+(.+?)(?:\.|!|$)/i,
      /i hope to\s+(.+?)(?:\.|!|$)/i,
    ];

    for (const pattern of goalPatterns) {
      const match = input.match(pattern);
      if (match) {
        extractions.goals.push(match[1].trim());
      }
    }

    // Detect projects
    const projectPatterns = [
      /(?:working on|building|creating|developing|making)\s+(?:a |an |the )?(.+?)(?:\.|!|,|$)/i,
      /my (?:project|app|site|website|game|startup|business|company)\s+(?:called |named )?(.+?)(?:\.|!|,|$)/i,
    ];

    for (const pattern of projectPatterns) {
      const match = input.match(pattern);
      if (match) {
        extractions.projects.push(match[1].trim());
      }
    }

    // Detect events/happenings
    const eventPatterns = [
      /(?:yesterday|today|last week|recently|just)\s+(.+?)(?:\.|!|$)/i,
      /i (?:went|did|saw|heard|found|discovered|started|finished)\s+(.+?)(?:\.|!|$)/i,
    ];

    for (const pattern of eventPatterns) {
      const match = input.match(pattern);
      if (match) {
        extractions.events.push(match[1].trim());
      }
    }

    return extractions;
  }

  /**
   * Apply deep extractions to memory
   */
  applyDeepExtractions(extractions, originalInput) {
    for (const person of extractions.people) {
      this.learnPerson(person, null);
    }

    for (const goal of extractions.goals) {
      this.learnGoal(goal, originalInput.substring(0, 100));
    }

    for (const project of extractions.projects) {
      this.learnProject(project, originalInput.substring(0, 100));
    }

    for (const event of extractions.events) {
      this.recordEvent(event);
    }
  }
}

export { KnowledgeBase };
