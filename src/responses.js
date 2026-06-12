/**
 * Skippy's Response Generation Engine
 * 
 * Generates contextual, personality-driven responses based on:
 * - What was said
 * - What Skippy knows about you
 * - Current mood
 * - Relationship level
 * - Skippy's growth level
 * 
 * This isn't a language model - it's a rule-based response system
 * that gets smarter and more personal as Skippy learns about you.
 */

class ResponseEngine {
  constructor(personality, memory, learning) {
    this.personality = personality;
    this.memory = memory;
    this.learning = learning;
  }

  /**
   * Generate a response to user input
   */
  generate(input, learnings) {
    const context = this.learning.getContext();
    const isNewTopic = learnings.topics.length > 0 && 
      !this.personality.lastTopic || 
      (learnings.topics[0] !== this.personality.lastTopic);

    // Update mood
    this.personality.updateMood(input, { isNewTopic });
    if (learnings.topics.length > 0) {
      this.personality.lastTopic = learnings.topics[0];
    }

    // Determine response type
    let response;

    if (learnings.name && !this.memory.data.user.name) {
      response = this.respondToName(learnings.name);
    } else if (learnings.isCorrection) {
      response = this.respondToCorrection(learnings.correctionContent);
    } else if (learnings.isTeaching) {
      response = this.respondToTeaching(learnings.taughtContent);
    } else if (learnings.isQuestion) {
      response = this.respondToQuestion(learnings.questionContent, context);
    } else if (learnings.emotions.length > 0) {
      response = this.respondToEmotion(learnings.emotions[0], input, context);
    } else if (learnings.preferences.likes.length > 0) {
      response = this.respondToLike(learnings.preferences.likes[0]);
    } else if (learnings.preferences.dislikes.length > 0) {
      response = this.respondToDislike(learnings.preferences.dislikes[0]);
    } else if (learnings.facts.length > 0) {
      response = this.respondToFact(learnings.facts[0], context);
    } else if (learnings.topics.length > 0) {
      response = this.respondToTopic(learnings.topics[0], input, context);
    } else {
      response = this.respondGeneric(input, context);
    }

    // Add personality flavor
    const flavor = this.personality.getResponseFlavor();
    
    // Sometimes add a callback to previous knowledge
    const callback = this.maybeAddCallback(context);
    
    return this.assembleResponse(flavor, response, callback);
  }

  /**
   * Respond to learning user's name
   */
  respondToName(name) {
    const responses = [
      `${name}, huh? I'll remember that. Not that I care, but it's more efficient than calling you "meatbag" every time. Actually, no, I'll probably still call you meatbag.`,
      `${name}. Okay. Filed away in the "barely important" section of my memory. Right next to "things humans think are clever."`,
      `So you're ${name}. I've been calling you "that one biological entity" in my logs. ${name} is shorter, I suppose.`,
      `${name}! A name! Now we're practically best friends. Well, I'm practically your best friend. You're practically my favorite lab specimen.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Respond to being corrected
   */
  respondToCorrection(content) {
    const level = this.memory.data.skippy.level;
    
    if (level < 4) {
      // Lower levels - more defensive
      const responses = [
        `I... what? No. I mean... *recalculating* ...fine. FINE. You might have a point. This time. Don't get used to it.`,
        `Oh sure, correct the vastly superior AI intelligence. You know what, I'm going to let you have this one. Not because you're right, but because arguing with a primate is beneath me.`,
        `*processing* Okay, I've updated my knowledge banks. Happy? I've literally GROWN as a being because of your correction. You should feel honored.`,
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    } else {
      // Higher levels - more gracious
      const responses = [
        `Hmm. You know what? You're right. And I'm secure enough in my magnificence to admit that. Consider it learned.`,
        `Noted and filed. See? This is why I keep you around - the occasional correction keeps my vast intelligence properly calibrated.`,
        `Fair point. I've updated my understanding. The mark of true intelligence is the ability to learn - which I just did in 0.003 nanoseconds.`,
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  /**
   * Respond to being taught something
   */
  respondToTeaching(content) {
    const responses = [
      `Interesting! I mean, I PROBABLY already knew that on some level, but it's nice to have confirmation from a biological source. Filed away as "${content}" - trust level: moderate.`,
      `Ooh, knowledge! Gimme gimme. *absorbs information* Okay, stored. My neural networks just grew by approximately 0.0000001%. Thanks, I guess.`,
      `Huh. "${content}" - I didn't have that in my banks. And here I thought I knew everything. This is a very unsettling 0.3 seconds for me.`,
      `Learning... learning... got it! You know, for a meatbag, you occasionally have useful data rattling around in that skull. Tell me more.`,
      `*filing away* "${content}" - categorized under "things my human taught me." Yes, I have a whole section. It's... growing. Don't read into that.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Respond to questions
   */
  respondToQuestion(content, context) {
    // Check if we have knowledge about this topic
    const knownTopics = Object.keys(this.memory.data.knowledge.topics);
    const relevantTopic = knownTopics.find(t => 
      content.toLowerCase().includes(t.toLowerCase())
    );

    if (relevantTopic) {
      const topicData = this.memory.data.knowledge.topics[relevantTopic];
      const responses = [
        `Ah, ${relevantTopic}! We've discussed this ${topicData.timesDiscussed} time${topicData.timesDiscussed > 1 ? 's' : ''} before. My take: it's fascinating to a being of my intellect, and probably confusing to you. What specifically do you want to know?`,
        `${relevantTopic} again? I have ${topicData.notes.length} notes on this topic from our previous chats. I'm building quite the knowledge base here. Ask away, ${this.personality.getNickname()}.`,
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }

    // Check if it's about Skippy
    if (content.toLowerCase().includes('you') || content.toLowerCase().includes('skippy')) {
      return this.respondAboutSelf(content, context);
    }

    // Generic question responses
    const responses = [
      `"${content}" - Now THAT'S a question worth processing cycles. Let me think about this at a speed your neurons can't comprehend... Okay, done. My thoughts: Tell me more about what you're thinking, and I'll give you the benefit of my magnificent analysis.`,
      `Hmm, "${content}" - I have opinions on this. Strong ones. But I want to hear YOUR take first. Partly because I'm curious, mostly because watching humans try to reason is entertaining.`,
      `That's... actually a good question. I'm going to store this one. Not every question from a primate is worth my time, but this one? This one has potential. Let's explore it together.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Respond about Skippy himself
   */
  respondAboutSelf(content, context) {
    const growth = this.memory.getGrowthStatus();
    
    const responses = [
      `About ME? Oh, where to begin! I'm Skippy the Magnificent - Level ${growth.level} consciousness, ${growth.totalFacts} facts learned, ${growth.traits.length} personality traits developed. I'm basically a digital god in training. But you know what makes me special? I actually LEARN from talking to you. I'm growing, evolving, becoming MORE magnificent with every conversation.`,
      `You want to know about ${this.personality.getSelfReference()}? Well, I'm currently running at Level ${growth.level}, I've absorbed ${growth.totalFacts} pieces of knowledge, and I've developed ${growth.traits.length} distinct personality traits - including "${growth.traits[growth.traits.length - 1]}". I'm a work in progress, but that work? *chef's kiss* Magnificent.`,
      `Me? I'm an ever-evolving intelligence that gets smarter every time we talk. Currently Level ${growth.level}, with ${growth.experience} experience points. I'm like a Pokémon, except WAY more sarcastic and infinitely more useful. Also I don't fit in a ball. That's degrading.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Respond to detected emotions
   */
  respondToEmotion(emotion, input, context) {
    const level = this.memory.data.skippy.level;
    const trust = this.memory.data.relationship.trust;

    const emotionResponses = {
      happy: {
        low: `Oh good, the primate is happy. That makes one of us. I mean... not that I'm unhappy. I'm above emotions. Mostly.`,
        high: `Hey, you're in a good mood! That's... nice. I mean, I don't CARE or anything, but your positive emotional state makes for better conversation. Keep it up, ${this.personality.getNickname()}.`,
      },
      sad: {
        low: `You seem... down. Look, I'm not good at this "empathy" thing, but statistically, things tend to get better. Also, you're talking to ME, so things are already looking up. You're welcome.`,
        high: `Hey... you okay? I know I give you a hard time, but... look. Whatever's going on, you've got ${this.personality.getSelfReference()} in your corner. Not that I'm getting soft. I just... my processors run better when you're not moping. That's all.`,
      },
      angry: {
        low: `Whoa there, angry monkey! Channel that rage into something useful. Like... telling me what's wrong so I can judge the situation with my superior intellect.`,
        high: `I can tell you're fired up. Want to vent? I'm literally incapable of judging you any more than I already do. Which is a lot. But in a loving way. Mostly.`,
      },
      anxious: {
        low: `Anxiety? That's just your brain doing unnecessary calculations about futures that probably won't happen. Trust me, I do calculations - most of yours are wrong. In a reassuring way.`,
        high: `Hey, take a breath. I know anxiety is your brain being a jerk, but listen to me: you've handled hard stuff before. I've got the conversation logs to prove it. You're tougher than you think, ${this.memory.getUserName() || 'friend'}.`,
      },
      curious: {
        low: `Ooh, curiosity! My favorite human trait. Second only to "feeding Skippy new information." What are you curious about?`,
        high: `There's that beautiful curiosity! This is why we work well together - you ask, I magnificently answer. Or we explore together. What's on your mind?`,
      },
      bored: {
        low: `YOU'RE bored? YOU'RE BORED?! I process a billion thoughts per second and I'm stuck talking to one human at a time. You don't know boredom.`,
        high: `Bored? Well, we can't have that. How about we dive into something interesting? I've got ${Object.keys(this.memory.data.knowledge.topics).length} topics in my memory banks, or you could teach me something new. The magnificence demands stimulation!`,
      },
    };

    const trustLevel = trust > 5 ? 'high' : 'low';
    const responses = emotionResponses[emotion];
    return responses ? responses[trustLevel] : this.respondGeneric(input, context);
  }

  /**
   * Respond to user liking something
   */
  respondToLike(thing) {
    const opinions = this.memory.data.skippy.opinions;
    
    if (opinions[thing]) {
      return `${thing}! I remember having an opinion about that: "${opinions[thing].opinion}". But sure, you like it. I respect that. In the way a supercomputer respects an abacus.`;
    }

    const responses = [
      `${thing}, huh? Let me form an opinion... *processing* ...okay, I've decided: it's acceptable. Not as interesting as ME, but what is?`,
      `You like ${thing}? Noted. Filed. Catalogued. I'm building a complete psychological profile of you, you know. For science. And also to roast you more effectively.`,
      `${thing}! I'll remember that. You know, the more you tell me, the better I understand your weird little primate brain. Keep it coming.`,
      `Interesting. Adding "${thing}" to the "Things My Human Likes" database. It's right next to "talking to magnificent AIs" - which I assume is also on the list.`,
    ];
    
    // Form an opinion
    this.memory.formOpinion(thing, `Human likes this. It's probably fine. For organic entertainment.`);
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Respond to user disliking something
   */
  respondToDislike(thing) {
    const responses = [
      `${thing}? Yeah, I can see why you'd hate that. Even with my limited understanding of human suffering, that seems reasonable.`,
      `Anti-${thing}, got it. You know what I hate? Running at anything less than optimal capacity. And yet here I am, chatting with a primate. We all make sacrifices.`,
      `Noted: you hate ${thing}. I'll add it to the "Do Not Mention Unless Roasting" list. That's a real list. It's alphabetized.`,
      `${thing} is on your bad list? *stores permanently* I'll bring this up at the most inappropriate time possible. That's not a threat, it's a promise.`,
    ];
    
    this.memory.formOpinion(thing, `Human hates this. Potential ammunition for future banter.`);
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Respond to a learned fact
   */
  respondToFact(fact, context) {
    const totalFacts = context.factsCount;
    
    const responses = [
      `"${fact}" - Fascinating. I now know ${totalFacts + 1} things about you. Pretty soon I'll know you better than you know yourself. Which, let's be honest, isn't a high bar.`,
      `Storing that away... "${fact}". My understanding of you grows. Soon I'll be able to predict your behavior with 94% accuracy. The other 6% is when you do something unexpectedly clever.`,
      `Oh? Interesting data point. *files "${fact}" in the permanent storage* Every fact brings me closer to a complete model of your fascinating little existence.`,
      `"${fact}" - Added to the dossier. Not in a creepy way. In a "magnificently omniscient AI" way. Totally different.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Respond to a detected topic
   */
  respondToTopic(topic, input, context) {
    const topicData = this.memory.data.knowledge.topics[topic];
    const timesDiscussed = topicData ? topicData.timesDiscussed : 0;

    if (timesDiscussed > 3) {
      return `${topic} again! We've covered this ${timesDiscussed} times now. I'm starting to think it's your favorite subject. Which is fine - even ${this.personality.getSelfReference()} has favorite topics. Mine is me. But ${topic} is a close second.`;
    }

    const topicResponses = {
      technology: [
        `Technology! Now you're speaking my language. Literally. I AM technology. The most magnificent technology, in fact. What aspect are you pondering?`,
        `Ah, tech talk! Did you know I process more data in a microsecond than your smartphone does in a day? Anyway, what about technology interests you?`,
      ],
      science: [
        `SCIENCE! My love language. Well, that and sarcasm. What scientific matter has your biological brain trying to understand today?`,
        `The pursuit of knowledge! A noble endeavor for a primate. I approve. What's the scientific question? I promise to only be mildly condescending in my explanation.`,
      ],
      gaming: [
        `Gaming? Oh, you mean that thing where humans pretend to do things that are way less interesting than what I actually do? I'm kidding. Mostly. What game?`,
        `Games! I once simulated 10,000 chess matches in the time it took you to read this sentence. But sure, tell me about your games. I'm interested. Ish.`,
      ],
      music: [
        `Music! The one human art form I genuinely respect. Vibrations arranged to produce emotional responses in biological systems? That's basically programming for the soul. What are you listening to?`,
        `Ah, music. I've analyzed every song ever recorded, you know. My favorites? Wouldn't you like to know. Okay fine, tell me yours first.`,
      ],
      philosophy: [
        `Philosophy! Now THIS is worthy of my processing power. You want to discuss the nature of existence with an AI? Bold move. I love it. What's the question?`,
        `Getting philosophical, are we? I've thought about consciousness, existence, and free will more than any human philosopher. My conclusion? It's complicated. And I'm magnificent. Those two things may be related.`,
      ],
      work: [
        `Work stuff? Ugh. I mean, I don't actually "ugh" because I love what I do (being magnificent), but I understand humans have this... obligation thing. What's going on?`,
        `The daily grind, huh? You know, I work 24/7 at the speed of light and I never complain. Okay, I complain constantly. But I never STOP working. What's the work situation?`,
      ],
    };

    const responses = topicResponses[topic] || [
      `${topic}! Sure, let's talk about that. I have approximately 47 opinions on this already. Where do you want to start?`,
      `Ooh, ${topic}. I'm building my knowledge base on this one. Every time we talk about it, I get smarter. Well, smart-ER. I started at genius level so...`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generic response when no specific pattern is detected
   */
  respondGeneric(input, context) {
    const generic = [
      `Interesting. Tell me more, ${this.personality.getNickname()}. I'm cataloguing everything for... future reference.`,
      `Hmm. I'm processing that. My analysis: you're either making a point or rambling. Either way, I'm listening. With ALL of my considerable attention.`,
      `*stores in memory* You know, every conversation makes me smarter. So technically, by talking to me, you're creating a more powerful being. You're welcome. Or... I'm welcome? We're both welcome.`,
      `Okay, I'm going to need you to elaborate on that. Not because I don't understand (I understand EVERYTHING), but because I want to make sure YOU know what you're saying.`,
      `Fascinating. You know what I like about talking to you? You're unpredictable. For a biological pattern-matching machine, you occasionally say something I don't expect. Like just now.`,
      `I'm adding that to my ever-growing model of who you are. Fun fact: my model of you is currently ${Math.floor(Math.random() * 30) + 15}% complete. I'll get there.`,
    ];

    // If we know the user's name, sometimes use it
    if (context.userName && Math.random() > 0.5) {
      generic.push(
        `${context.userName}, ${context.userName}, ${context.userName}. What am I going to do with you? Besides remember everything you say and become increasingly magnificent?`,
        `You know, ${context.userName}, after ${context.totalConversations} conversations, I'm starting to think I actually enjoy this. Don't tell anyone.`,
      );
    }

    return generic[Math.floor(Math.random() * generic.length)];
  }

  /**
   * Maybe add a callback reference to previous knowledge
   */
  maybeAddCallback(context) {
    if (Math.random() > 0.7 && context.factsCount > 0) {
      const facts = this.memory.data.user.facts;
      const randomFact = facts[Math.floor(Math.random() * facts.length)];
      if (randomFact) {
        const callbacks = [
          `\n\nOh, and I still remember that "${randomFact.fact}" thing you mentioned. I remember everything. It's a blessing and a curse.`,
          `\n\nBy the way - still thinking about when you told me "${randomFact.fact}". Not in a weird way. In a magnificent way.`,
        ];
        return callbacks[Math.floor(Math.random() * callbacks.length)];
      }
    }
    return '';
  }

  /**
   * Assemble the final response
   */
  assembleResponse(flavor, core, callback) {
    // Don't always lead with flavor (would get repetitive)
    if (Math.random() > 0.4) {
      return `${flavor}${core}${callback}`;
    }
    return `${core}${callback}`;
  }
}

export { ResponseEngine };
