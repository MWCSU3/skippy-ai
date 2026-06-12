// ============================================================
// Web Search Service
// Searches the web for answers and formulates card responses.
//
// Architecture:
// - SearchProvider interface = pluggable (Google, Bing, DuckDuckGo, etc.)
// - AnswerFormatter = takes raw search results → clean card-ready answer
// - Can be used to auto-generate the "back" of a card from a question
// ============================================================

/**
 * A single search result from any provider.
 */
export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;  // domain name
}

/**
 * A formatted answer ready to be used as a card's back content.
 */
export interface FormattedAnswer {
  answer: string;          // The concise answer text
  sources: string[];       // URLs where the info came from
  confidence: 'high' | 'medium' | 'low';
  raw_results: SearchResult[];
}

/**
 * Interface for search providers — swap implementations without changing app code.
 */
export interface SearchProvider {
  name: string;
  search(query: string, maxResults?: number): Promise<SearchResult[]>;
}

// ============================================================
// DuckDuckGo Instant Answer API (free, no API key needed)
// Good starting point — works without any signup
// ============================================================
export class DuckDuckGoProvider implements SearchProvider {
  name = 'DuckDuckGo';

  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    // DuckDuckGo Instant Answer API
    const encoded = encodeURIComponent(query);
    const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim().length === 0) {
        return [];
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('DuckDuckGo returned invalid JSON');
        return [];
      }
      const results: SearchResult[] = [];

      // Abstract (direct answer)
      if (data.Abstract) {
        results.push({
          title: data.Heading || query,
          snippet: data.Abstract,
          url: data.AbstractURL || '',
          source: data.AbstractSource || 'DuckDuckGo',
        });
      }

      // Related topics
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
          if (topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0] || '',
              snippet: topic.Text,
              url: topic.FirstURL || '',
              source: 'DuckDuckGo',
            });
          }
        }
      }

      // Definition
      if (data.Definition && results.length < maxResults) {
        results.push({
          title: `Definition: ${query}`,
          snippet: data.Definition,
          url: data.DefinitionURL || '',
          source: data.DefinitionSource || 'DuckDuckGo',
        });
      }

      return results.slice(0, maxResults);
    } catch (error) {
      console.error('DuckDuckGo search failed:', error);
      return [];
    }
  }
}

// ============================================================
// Google Custom Search (requires API key — for later)
// ============================================================
export class GoogleSearchProvider implements SearchProvider {
  name = 'Google';
  private apiKey: string;
  private searchEngineId: string;

  constructor(apiKey: string, searchEngineId: string) {
    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
  }

  async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    const encoded = encodeURIComponent(query);
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.searchEngineId}&q=${encoded}&num=${maxResults}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const results: SearchResult[] = [];

      if (data.items) {
        for (const item of data.items) {
          results.push({
            title: item.title || '',
            snippet: item.snippet || '',
            url: item.link || '',
            source: new URL(item.link).hostname,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Google search failed:', error);
      return [];
    }
  }
}

// ============================================================
// Web Search Service — the main class the app uses
// ============================================================
export class WebSearchService {
  private provider: SearchProvider;

  constructor(provider?: SearchProvider) {
    // Default to DuckDuckGo (free, no key needed)
    this.provider = provider || new DuckDuckGoProvider();
  }

  /**
   * Search for an answer to a question.
   * Use this when creating a card and you want to auto-fill the back.
   */
  async searchForAnswer(question: string): Promise<FormattedAnswer> {
    const results = await this.provider.search(question);

    if (results.length === 0) {
      return {
        answer: 'No answer found. Try rephrasing the question.',
        sources: [],
        confidence: 'low',
        raw_results: [],
      };
    }

    // Format the answer from search results
    const answer = this.formatAnswer(question, results);
    const sources = results
      .filter(r => r.url)
      .map(r => r.url)
      .slice(0, 3);

    // Determine confidence based on result quality
    const confidence = this.assessConfidence(results);

    return {
      answer,
      sources,
      confidence,
      raw_results: results,
    };
  }

  /**
   * Generate a complete card (front + back) from a topic/question.
   */
  async generateCard(question: string): Promise<{ front: string; back: string; sources: string[] }> {
    const result = await this.searchForAnswer(question);

    return {
      front: question,
      back: result.answer + (result.sources.length > 0
        ? `\n\nSources: ${result.sources.join(', ')}`
        : ''),
      sources: result.sources,
    };
  }

  /**
   * Verify/enhance an existing card's answer by searching the web.
   */
  async verifyAnswer(question: string, currentAnswer: string): Promise<{
    isAccurate: boolean;
    suggestedAnswer: string;
    sources: string[];
  }> {
    const result = await this.searchForAnswer(question);

    // Simple heuristic: check if key terms from search appear in current answer
    const searchTerms = this.extractKeyTerms(result.answer);
    const answerTerms = this.extractKeyTerms(currentAnswer);
    const overlap = searchTerms.filter(t => answerTerms.includes(t));
    const isAccurate = overlap.length >= Math.min(3, searchTerms.length * 0.5);

    return {
      isAccurate,
      suggestedAnswer: result.answer,
      sources: result.sources,
    };
  }

  /**
   * Format raw search results into a clean, concise answer.
   */
  private formatAnswer(question: string, results: SearchResult[]): string {
    // Use the best snippet as the primary answer
    const primary = results[0];
    let answer = primary.snippet;

    // If the primary answer is short, supplement with additional results
    if (answer.length < 100 && results.length > 1) {
      const supplementary = results
        .slice(1, 3)
        .map(r => r.snippet)
        .filter(s => s && s !== answer);

      if (supplementary.length > 0) {
        answer += '\n\n' + supplementary.join('\n\n');
      }
    }

    // Clean up the answer
    answer = answer
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .replace(/\.{3,}/g, '...')     // Fix excessive dots
      .trim();

    // Cap at reasonable length for a flashcard
    if (answer.length > 500) {
      answer = answer.slice(0, 497) + '...';
    }

    return answer;
  }

  /**
   * Assess how confident we are in the answer.
   */
  private assessConfidence(results: SearchResult[]): 'high' | 'medium' | 'low' {
    if (results.length === 0) return 'low';

    const primaryLength = results[0].snippet.length;

    // Long, detailed primary answer = high confidence
    if (primaryLength > 200 && results.length >= 2) return 'high';
    if (primaryLength > 50) return 'medium';
    return 'low';
  }

  /**
   * Extract key terms from text for comparison.
   */
  private extractKeyTerms(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'shall',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
      'it', 'this', 'that', 'which', 'who', 'what', 'where', 'when',
      'how', 'and', 'or', 'not', 'but', 'if', 'than', 'as',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }
}
