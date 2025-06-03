import axios from 'axios';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevanceScore: number;
}

export interface TechnicalInfo {
  topic: string;
  summary: string;
  keyPoints: string[];
  sources: WebSearchResult[];
  lastUpdated: Date;
}

export class WebSearchService {
  private cache: Map<string, TechnicalInfo> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  public async searchTechnicalInfo(query: string): Promise<TechnicalInfo | null> {
    const cacheKey = query.toLowerCase().trim();

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.lastUpdated.getTime() < this.CACHE_DURATION) {
        return cached;
      }
    }

    try {
      // Use DuckDuckGo Instant Answer API for technical queries
      const searchResults = await this.performWebSearch(query);

      if (searchResults.length === 0) {
        return null;
      }

      const technicalInfo: TechnicalInfo = {
        topic: query,
        summary: this.generateSummary(searchResults),
        keyPoints: this.extractKeyPoints(searchResults),
        sources: searchResults,
        lastUpdated: new Date()
      };

      this.cache.set(cacheKey, technicalInfo);
      return technicalInfo;
    } catch (error) {
      console.error('Error in web search:', error);
      return null;
    }
  }

  private async performWebSearch(query: string): Promise<WebSearchResult[]> {
    try {
      // Enhanced query for technical content
      const technicalQuery = this.enhanceQueryForTechnical(query);

      // Use multiple search strategies
      const results: WebSearchResult[] = [];

      // Strategy 1: Search for official documentation
      const docResults = await this.searchDocumentation(technicalQuery);
      results.push(...docResults);

      // Strategy 2: Search for recent discussions and issues
      const discussionResults = await this.searchDiscussions(technicalQuery);
      results.push(...discussionResults);

      // Strategy 3: Search for tutorials and guides
      const tutorialResults = await this.searchTutorials(technicalQuery);
      results.push(...tutorialResults);

      // Remove duplicates and sort by relevance
      const uniqueResults = this.deduplicateResults(results);
      return uniqueResults.slice(0, 10); // Limit to top 10 results
    } catch (error) {
      console.error('Error performing web search:', error);
      return [];
    }
  }

  private enhanceQueryForTechnical(query: string): string {
    const technicalKeywords = [
      'documentation', 'API', 'tutorial', 'guide', 'best practices',
      'examples', 'migration', 'changelog', 'release notes'
    ];

    // Add technical context if not present
    if (!technicalKeywords.some(keyword => query.toLowerCase().includes(keyword))) {
      return `${query} documentation examples`;
    }

    return query;
  }

  private async searchDocumentation(query: string): Promise<WebSearchResult[]> {
    const docSites = [
      'site:docs.microsoft.com',
      'site:developer.mozilla.org',
      'site:stackoverflow.com',
      'site:github.com',
      'site:npmjs.com',
      'site:pypi.org'
    ];

    const results: WebSearchResult[] = [];

    for (const site of docSites.slice(0, 3)) { // Limit for performance
      try {
        const siteResults = await this.searchWithSiteFilter(query, site);
        results.push(...siteResults);
      } catch (error) {
        console.warn(`Error searching ${site}:`, error);
      }
    }

    return results;
  }

  private async searchDiscussions(query: string): Promise<WebSearchResult[]> {
    const discussionSites = [
      'site:reddit.com/r/programming',
      'site:dev.to',
      'site:medium.com',
      'site:hashnode.com'
    ];

    const results: WebSearchResult[] = [];

    for (const site of discussionSites.slice(0, 2)) {
      try {
        const siteResults = await this.searchWithSiteFilter(query, site);
        results.push(...siteResults);
      } catch (error) {
        console.warn(`Error searching ${site}:`, error);
      }
    }

    return results;
  }

  private async searchTutorials(query: string): Promise<WebSearchResult[]> {
    const tutorialQuery = `${query} tutorial guide how to`;
    return await this.searchWithSiteFilter(tutorialQuery, '');
  }

  private async searchWithSiteFilter(query: string, siteFilter: string): Promise<WebSearchResult[]> {
    try {
      // Simulate web search results (in a real implementation, you'd use a search API)
      // For now, return mock results based on common patterns
      return this.generateMockResults(query, siteFilter);
    } catch (error) {
      console.error('Error in site-filtered search:', error);
      return [];
    }
  }

  private generateMockResults(query: string, siteFilter: string): WebSearchResult[] {
    // This is a placeholder - in a real implementation, you'd integrate with:
    // - Google Custom Search API
    // - Bing Search API
    // - DuckDuckGo API
    // - Or scrape search results (following terms of service)

    const mockResults: WebSearchResult[] = [];

    if (query.toLowerCase().includes('react')) {
      mockResults.push({
        title: 'React Documentation - Getting Started',
        url: 'https://reactjs.org/docs/getting-started.html',
        snippet: 'React is a JavaScript library for building user interfaces. Learn what React is all about on our homepage or in the tutorial.',
        source: 'reactjs.org',
        relevanceScore: 0.95
      });
    }

    if (query.toLowerCase().includes('typescript')) {
      mockResults.push({
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/',
        snippet: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
        source: 'typescriptlang.org',
        relevanceScore: 0.93
      });
    }

    if (query.toLowerCase().includes('node')) {
      mockResults.push({
        title: 'Node.js Documentation',
        url: 'https://nodejs.org/en/docs/',
        snippet: 'Node.js is a JavaScript runtime built on Chrome\'s V8 JavaScript engine.',
        source: 'nodejs.org',
        relevanceScore: 0.91
      });
    }

    return mockResults;
  }

  private deduplicateResults(results: WebSearchResult[]): WebSearchResult[] {
    const seen = new Set<string>();
    const unique: WebSearchResult[] = [];

    for (const result of results) {
      const key = `${result.url}_${result.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    return unique.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private generateSummary(results: WebSearchResult[]): string {
    if (results.length === 0) {
      return 'No relevant information found.';
    }

    const topResults = results.slice(0, 3);
    const snippets = topResults.map(r => r.snippet).join(' ');

    // Simple summary generation (in a real implementation, you might use NLP)
    const sentences = snippets.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  private extractKeyPoints(results: WebSearchResult[]): string[] {
    const keyPoints: string[] = [];

    for (const result of results.slice(0, 5)) {
      const sentences = result.snippet.split(/[.!?]+/);
      for (const sentence of sentences) {
        if (sentence.trim().length > 30 && sentence.trim().length < 150) {
          keyPoints.push(sentence.trim());
        }
      }
    }

    return keyPoints.slice(0, 5);
  }

  public async getLatestVersionInfo(packageName: string): Promise<any> {
    try {
      // Check npm registry for package info
      const response = await axios.get(`https://registry.npmjs.org/${packageName}/latest`);
      return {
        name: response.data.name,
        version: response.data.version,
        description: response.data.description,
        lastModified: response.data.time?.modified,
        dependencies: response.data.dependencies,
        repository: response.data.repository
      };
    } catch (error) {
      console.error(`Error getting version info for ${packageName}:`, error);
      return null;
    }
  }

  public async searchSecurityAdvisories(packageName: string): Promise<any[]> {
    try {
      // In a real implementation, you'd check:
      // - GitHub Security Advisories
      // - npm audit database
      // - CVE databases

      return []; // Placeholder
    } catch (error) {
      console.error(`Error searching security advisories for ${packageName}:`, error);
      return [];
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}