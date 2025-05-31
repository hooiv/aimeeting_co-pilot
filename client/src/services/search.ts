export interface SearchFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  participants?: string[];
  tags?: string[];
  duration?: {
    min: number;
    max: number;
  };
  hasRecording?: boolean;
  hasTranscript?: boolean;
  hasInsights?: boolean;
  status?: string[];
  hosts?: string[];
}

export interface SearchResult {
  id: string;
  type: 'meeting' | 'recording' | 'transcript' | 'insight' | 'document';
  title: string;
  description: string;
  highlights: string[];
  score: number;
  metadata: {
    date?: string;
    duration?: string;
    participants?: string[];
    tags?: string[];
    host?: string;
    status?: string;
  };
  url: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  took: number;
  aggregations?: {
    types: { [key: string]: number };
    dates: { [key: string]: number };
    tags: { [key: string]: number };
    participants: { [key: string]: number };
  };
  suggestions?: string[];
}

export interface SearchOptions {
  query: string;
  filters?: SearchFilters;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  page?: number;
  size?: number;
  highlight?: boolean;
  suggest?: boolean;
}

class SearchService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  async searchMeetings(query: string, filters?: SearchFilters): Promise<SearchResponse> {
    return this.search({
      query,
      filters: {
        ...filters,
      },
      highlight: true,
      suggest: true,
    });
  }

  async searchTranscripts(query: string, meetingId?: string): Promise<SearchResponse> {
    const filters: SearchFilters = {};
    if (meetingId) {
      // Add meeting ID filter when backend supports it
    }

    return this.search({
      query,
      filters,
      highlight: true,
    });
  }

  async searchInsights(query: string, filters?: SearchFilters): Promise<SearchResponse> {
    return this.search({
      query,
      filters,
      highlight: true,
    });
  }

  async searchRecordings(query: string, filters?: SearchFilters): Promise<SearchResponse> {
    return this.search({
      query,
      filters,
      highlight: true,
    });
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/suggestions?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  async getSearchHistory(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error('Search history error:', error);
      return [];
    }
  }

  async saveSearch(query: string, filters?: SearchFilters): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/search/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ query, filters }),
      });

      return response.ok;
    } catch (error) {
      console.error('Save search error:', error);
      return false;
    }
  }

  async getSavedSearches(): Promise<Array<{ id: string; name: string; query: string; filters?: SearchFilters }>> {
    try {
      const response = await fetch(`${this.baseUrl}/search/saved`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.searches || [];
    } catch (error) {
      console.error('Saved searches error:', error);
      return [];
    }
  }

  async deleteSavedSearch(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/search/saved/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Delete saved search error:', error);
      return false;
    }
  }

  // Advanced search with natural language processing
  async naturalLanguageSearch(query: string): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search/natural`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Natural language search failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Natural language search error:', error);
      throw error;
    }
  }

  // Semantic search using AI embeddings
  async semanticSearch(query: string, options?: Partial<SearchOptions>): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/search/semantic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ query, ...options }),
      });

      if (!response.ok) {
        throw new Error('Semantic search failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Semantic search error:', error);
      throw error;
    }
  }

  // Search analytics
  async getSearchAnalytics(timeRange: string = '30d'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/search/analytics?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Search analytics error:', error);
      return null;
    }
  }

  // Build Elasticsearch query
  buildElasticsearchQuery(options: SearchOptions): any {
    const query: any = {
      bool: {
        must: [],
        filter: [],
        should: [],
      },
    };

    // Main search query
    if (options.query) {
      query.bool.must.push({
        multi_match: {
          query: options.query,
          fields: [
            'title^3',
            'description^2',
            'transcript.content',
            'insights.content',
            'tags^2',
            'participants.name',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // Apply filters
    if (options.filters) {
      const { filters } = options;

      if (filters.dateRange) {
        query.bool.filter.push({
          range: {
            date: {
              gte: filters.dateRange.start,
              lte: filters.dateRange.end,
            },
          },
        });
      }

      if (filters.participants && filters.participants.length > 0) {
        query.bool.filter.push({
          terms: {
            'participants.email': filters.participants,
          },
        });
      }

      if (filters.tags && filters.tags.length > 0) {
        query.bool.filter.push({
          terms: {
            tags: filters.tags,
          },
        });
      }

      if (filters.duration) {
        query.bool.filter.push({
          range: {
            duration_minutes: {
              gte: filters.duration.min,
              lte: filters.duration.max,
            },
          },
        });
      }

      if (filters.hasRecording !== undefined) {
        query.bool.filter.push({
          term: {
            has_recording: filters.hasRecording,
          },
        });
      }

      if (filters.hasTranscript !== undefined) {
        query.bool.filter.push({
          term: {
            has_transcript: filters.hasTranscript,
          },
        });
      }

      if (filters.hasInsights !== undefined) {
        query.bool.filter.push({
          term: {
            has_insights: filters.hasInsights,
          },
        });
      }

      if (filters.status && filters.status.length > 0) {
        query.bool.filter.push({
          terms: {
            status: filters.status,
          },
        });
      }

      if (filters.hosts && filters.hosts.length > 0) {
        query.bool.filter.push({
          terms: {
            'host.email': filters.hosts,
          },
        });
      }
    }

    return query;
  }
}

export const searchService = new SearchService();
export default searchService;
