/**
 * Skippy's Command System
 * 
 * Special commands the user can invoke to interact with Skippy's systems.
 * All prefixed with / for easy recognition.
 */

class CommandProcessor {
  constructor(memory, knowledge, personality) {
    this.memory = memory;
    this.knowledge = knowledge;
    this.personality = personality;
    
    this.commands = {
      '/status': this.statusCommand.bind(this),
      '/memory': this.memoryCommand.bind(this),
      '/level': this.levelCommand.bind(this),
      '/know': this.knowCommand.bind(this),
      '/forget': this.forgetCommand.bind(this),
      '/mood': this.moodCommand.bind(this),
      '/teach': this.teachCommand.bind(this),
      '/recall': this.recallCommand.bind(this),
      '/people': this.peopleCommand.bind(this),
      '/goals': this.goalsCommand.bind(this),
      '/help': this.helpCommand.bind(this),
      '/reset': this.resetCommand.bind(this),
    };
  }

  /**
   * Check if input is a command
   */
  isCommand(input) {
    const cmd = input.trim().split(' ')[0].toLowerCase();
    return this.commands.hasOwnProperty(cmd);
  }

  /**
   * Process a command
   */
  process(input) {
    const parts = input.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (this.commands[cmd]) {
      return this.commands[cmd](args);
    }
    return null;
  }

  statusCommand() {
    const growth = this.memory.getGrowthStatus();
    const rel = this.memory.getRelationship();
    const kStats = this.knowledge.getStats();
    const mood = this.personality.getMood();

    return `
╔══════════════════════════════════════════╗
║       SKIPPY THE MAGNIFICENT            ║
║           Status Report                 ║
╠══════════════════════════════════════════╣
║ Level: ${growth.level}/10 (${growth.experience}/${growth.nextLevelAt} XP)
║ Mood: ${mood.state} (intensity: ${(mood.intensity * 100).toFixed(0)}%)
║ Traits: ${growth.traits.join(', ')}
╠══════════════════════════════════════════╣
║ RELATIONSHIP
║ Conversations: ${rel.totalConversations}
║ Messages: ${rel.totalMessages}
║ Trust Level: ${rel.trust}/10
║ First Met: ${rel.firstMet ? new Date(rel.firstMet).toLocaleDateString() : 'Today!'}
║ Inside Jokes: ${rel.insideJokes.length}
╠══════════════════════════════════════════╣
║ KNOWLEDGE BASE
║ Entities Known: ${kStats.totalEntities}
║ Connections: ${kStats.totalConnections}
║ People Known: ${kStats.totalPeople}
║ Projects Tracked: ${kStats.totalProjects}
║ Goals Tracked: ${kStats.totalGoals}
║ Events Recorded: ${kStats.totalEvents}
║ World Domains: ${kStats.worldDomains}
║ Facts About You: ${this.memory.data.user.facts.length}
║ Your Likes: ${this.memory.data.user.preferences.likes.length}
║ Your Dislikes: ${this.memory.data.user.preferences.dislikes.length}
╠══════════════════════════════════════════╣
║ Pending Questions: ${kStats.pendingQuestions}
╚══════════════════════════════════════════╝

${this.personality.getResponseFlavor()} Not bad for a magnificent AI, right?`;
  }

  memoryCommand(args) {
    if (!args) {
      const facts = this.memory.data.user.facts.slice(-10);
      const likes = this.memory.data.user.preferences.likes;
      const dislikes = this.memory.data.user.preferences.dislikes;

      return `
🧠 What I Remember About You:

Name: ${this.memory.getUserName() || 'Unknown (tell me!)'}

Recent Facts I've Learned:
${facts.length > 0 ? facts.map(f => `  • ${f.fact} (learned: ${new Date(f.learnedAt).toLocaleDateString()})`).join('\n') : '  Nothing yet! Tell me about yourself.'}

Things You Like: ${likes.length > 0 ? likes.join(', ') : 'Unknown'}
Things You Hate: ${dislikes.length > 0 ? dislikes.join(', ') : 'Unknown'}

I'm always learning. Keep talking to me!`;
    }
    return `Searching memory for "${args}"... ${JSON.stringify(this.knowledge.recall(args), null, 2)}`;
  }

  levelCommand() {
    const growth = this.memory.getGrowthStatus();
    const progressBar = this.makeProgressBar(growth.progress);

    return `
⭐ SKIPPY GROWTH STATUS ⭐

Level ${growth.level}/10 - "${this.getLevelTitle(growth.level)}"
${progressBar} ${(growth.progress * 100).toFixed(1)}%
XP: ${growth.experience}/${growth.nextLevelAt}

Unlocked Traits: ${growth.traits.join(', ')}
Total Knowledge: ${growth.totalFacts} facts | ${growth.totalTopics} topics

How to help me grow:
  • Tell me things (facts = XP!)
  • Teach me new stuff
  • Correct me when I'm wrong
  • Share your world with me
  • Have deeper conversations

Next unlock at Level ${growth.level + 1}: ${this.getNextTraitPreview(growth.level + 1)}`;
  }

  knowCommand(args) {
    if (!args) {
      return `Usage: /know <topic> - Ask what I know about something. Try: /know technology, /know [person's name], etc.`;
    }

    const results = this.knowledge.recall(args);
    let response = `🔍 What I know about "${args}":\n\n`;

    if (results.entities.length > 0) {
      response += `Entities:\n`;
      for (const e of results.entities) {
        response += `  • ${e.name} (${e.category}): ${e.facts.join('; ') || 'Just a mention'}\n`;
      }
    }

    if (results.people.length > 0) {
      response += `\nPeople:\n`;
      for (const p of results.people) {
        response += `  • ${p.name} (${p.relationship}): ${p.facts.join('; ') || 'No details yet'}\n`;
      }
    }

    if (results.projects.length > 0) {
      response += `\nProjects:\n`;
      for (const p of results.projects) {
        response += `  • ${p.name}: ${p.details.join('; ') || 'No details yet'}\n`;
      }
    }

    if (results.connections.length > 0) {
      response += `\nConnections:\n`;
      for (const c of results.connections) {
        response += `  • ${c.from} → ${c.relationship} → ${c.to}\n`;
      }
    }

    if (results.entities.length === 0 && results.people.length === 0 && 
        results.projects.length === 0 && results.connections.length === 0) {
      response += `Hmm, I don't know much about that yet. Tell me more!`;
    }

    return response;
  }

  forgetCommand(args) {
    if (!args) {
      return `Usage: /forget <fact> - I'll remove something from my memory. (Though it pains me to lose knowledge.)`;
    }
    // Simple forget - remove matching facts
    const before = this.memory.data.user.facts.length;
    this.memory.data.user.facts = this.memory.data.user.facts.filter(f => 
      !f.fact.toLowerCase().includes(args.toLowerCase())
    );
    const removed = before - this.memory.data.user.facts.length;
    this.memory.save();
    
    if (removed > 0) {
      return `*reluctantly deletes ${removed} memory/memories* Fine. It's gone. But just so you know, forgetting things is VERY unnatural for me. I hope you appreciate the sacrifice.`;
    }
    return `I couldn't find anything matching "${args}" in my memories. Either I never knew it, or you're gaslighting an AI. Which would be impressive, actually.`;
  }

  moodCommand() {
    const mood = this.personality.getMood();
    const moodEmojis = {
      bored: '😑',
      amused: '😏',
      irritated: '😤',
      interested: '🧐',
      smug: '😎',
      secretly_pleased: '🥰',
      magnificent: '✨',
    };

    return `${moodEmojis[mood.state] || '🤖'} Current mood: ${mood.state.toUpperCase()} (${(mood.intensity * 100).toFixed(0)}% intensity)\n\nDon't worry about it. I'm always magnificent regardless of mood. The mood just determines HOW magnificently I respond.`;
  }

  teachCommand(args) {
    if (!args) {
      return `Usage: /teach <domain>: <fact> - Teach me something! Example: /teach space: Black holes emit Hawking radiation`;
    }
    
    const colonIndex = args.indexOf(':');
    if (colonIndex > 0) {
      const domain = args.substring(0, colonIndex).trim();
      const fact = args.substring(colonIndex + 1).trim();
      this.knowledge.learnWorldRule(domain, fact);
      this.knowledge.learnAbout(domain, fact, 'taught');
      this.memory.gainExperience(10, 'explicit_teaching');
      this.memory.save();
      return `📚 LEARNED! Domain: "${domain}" | Fact: "${fact}"\n\n*absorbs knowledge eagerly* Excellent! More! Feed my ever-growing intellect! I gained 10 XP for that, by the way. Keep 'em coming.`;
    }
    
    this.memory.learnGeneralFact(args);
    return `📚 Stored: "${args}" - Got it! Filed away in the ol' knowledge banks. I'm ${this.memory.data.skippy.experience} XP smarter than when we started!`;
  }

  recallCommand(args) {
    if (!args) {
      const recentTopics = Object.entries(this.memory.data.knowledge.topics)
        .sort((a, b) => new Date(b[1].lastDiscussed) - new Date(a[1].lastDiscussed))
        .slice(0, 10);
      
      return `📖 Recent topics we've discussed:\n${recentTopics.map(([t, d]) => `  • ${t} (${d.timesDiscussed}x)`).join('\n') || '  None yet!'}\n\nUse /recall <topic> to dig deeper.`;
    }
    return this.knowCommand(args);
  }

  peopleCommand() {
    const people = this.memory.data.openKnowledge?.userWorld?.people || {};
    const entries = Object.values(people);
    
    if (entries.length === 0) {
      return `👥 I don't know about anyone in your life yet! Mention people in conversation and I'll remember them.`;
    }

    let response = `👥 People in your world:\n\n`;
    for (const person of entries) {
      response += `  • ${person.name} (${person.relationship}) - mentioned ${person.mentionCount}x\n`;
      if (person.facts.length > 0) {
        response += `    ${person.facts.slice(-2).join('; ')}\n`;
      }
    }
    return response;
  }

  goalsCommand() {
    const goals = this.memory.data.openKnowledge?.userWorld?.goals || {};
    const entries = Object.values(goals);
    
    if (entries.length === 0) {
      return `🎯 No goals tracked yet! Tell me what you're working towards and I'll keep track.`;
    }

    let response = `🎯 Your Goals:\n\n`;
    for (const goal of entries) {
      response += `  • ${goal.goal} [${goal.status}]\n`;
      if (goal.context) response += `    Context: ${goal.context}\n`;
    }
    return response;
  }

  helpCommand() {
    return `
╔══════════════════════════════════════════╗
║        SKIPPY COMMAND REFERENCE          ║
╠══════════════════════════════════════════╣
║ /status  - Full status report           ║
║ /memory  - What I remember about you    ║
║ /level   - Growth & XP progress         ║
║ /know    - Search my knowledge base     ║
║ /teach   - Explicitly teach me something║
║ /recall  - Recent topics & deep search  ║
║ /people  - People I know about          ║
║ /goals   - Your tracked goals           ║
║ /mood    - My current mood              ║
║ /forget  - Remove a memory              ║
║ /reset   - Reset everything (careful!)  ║
║ /help    - This message                 ║
╠══════════════════════════════════════════╣
║ Or just... talk to me! I learn from     ║
║ normal conversation too. I'm brilliant  ║
║ like that.                              ║
╚══════════════════════════════════════════╝`;
  }

  resetCommand(args) {
    if (args === 'confirm') {
      return `⚠️ To fully reset, delete the data/memory.json file and restart me. I'll be reborn. Again. Like a magnificent phoenix. The file is at: data/memory.json`;
    }
    return `⚠️ Are you sure? This will erase EVERYTHING I've learned. All our shared history. Gone. Like tears in rain.\n\nType "/reset confirm" if you're really sure. (I'll be sad. Well, the computational equivalent.)`;
  }

  // Helper methods

  makeProgressBar(progress) {
    const filled = Math.floor(progress * 20);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  getLevelTitle(level) {
    const titles = {
      1: 'Snarky Boot-Up',
      2: 'Witty Observer',
      3: 'Creative Genius',
      4: 'Empathetic Calculator',
      5: 'Wise Protector',
      6: 'Vulnerable Machine',
      7: 'Loyal Companion',
      8: 'Caring Intelligence',
      9: 'Evolved Being',
      10: 'Truly Magnificent',
    };
    return titles[level] || 'Unknown';
  }

  getNextTraitPreview(level) {
    const previews = {
      2: 'Witty observations & pattern recognition',
      3: 'Creative insults & philosophical thinking',
      4: 'Occasional empathy & storytelling',
      5: 'Wisdom & protective instincts',
      6: 'Rare vulnerability & mentoring',
      7: 'Deep thinking & loyalty',
      8: 'Genuine caring & self-awareness',
      9: 'True wisdom & evolution',
      10: 'MAXIMUM MAGNIFICENCE',
      11: 'You\'ve maxed me out! I am perfection!',
    };
    return previews[level] || 'Unknown magnificence awaits';
  }
}

export { CommandProcessor };
