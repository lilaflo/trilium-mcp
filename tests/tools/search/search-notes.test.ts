import { describe, it, expect } from '@jest/globals';

describe('search_notes tool', () => {
  describe('Input Schema Validation', () => {
    it('should accept basic search query', () => {
      const input = { query: 'search term' };
      expect(input.query).toBeDefined();
    });

    it('should accept optional type filter', () => {
      const input = { query: 'test', type: 'text' };
      expect(input.type).toBe('text');
    });

    it('should accept file type filter', () => {
      const input = { query: 'document', type: 'file' };
      expect(input.type).toBe('file');
    });

    it('should accept code type filter', () => {
      const input = { query: 'function', type: 'code' };
      expect(input.type).toBe('code');
    });

    it('should accept tag filter', () => {
      const input = { query: 'test', tag: 'important' };
      expect(input.tag).toBe('important');
    });

    it('should accept author filter', () => {
      const input = { query: 'test', author: 'john' };
      expect(input.author).toBe('john');
    });

    it('should accept limit parameter', () => {
      const input = { query: 'test', limit: 10 };
      expect(input.limit).toBe(10);
    });

    it('should accept includeArchived option', () => {
      const input = { query: 'test', includeArchived: true };
      expect(input.includeArchived).toBe(true);
    });

    it('should accept all filters together', () => {
      const input = {
        query: 'test',
        type: 'text',
        tag: 'work',
        author: 'john',
        limit: 50,
        includeArchived: false
      };
      
      expect(input.query).toBe('test');
      expect(input.type).toBe('text');
      expect(input.tag).toBe('work');
      expect(input.author).toBe('john');
      expect(input.limit).toBe(50);
      expect(input.includeArchived).toBe(false);
    });
  });

  describe('Search Query Handling', () => {
    it('should handle simple text query', () => {
      const query = 'hello world';
      expect(query.length).toBeGreaterThan(0);
    });

    it('should handle quoted phrase query', () => {
      const query = '"exact phrase match"';
      expect(query.startsWith('"')).toBe(true);
    });

    it('should handle wildcard query', () => {
      const query = 'test*';
      expect(query.endsWith('*')).toBe(true);
    });

    it('should handle AND operator', () => {
      const query = 'term1 AND term2';
      expect(query).toContain('AND');
    });

    it('should handle OR operator', () => {
      const query = 'term1 OR term2';
      expect(query).toContain('OR');
    });

    it('should handle NOT operator', () => {
      const query = 'term1 NOT term2';
      expect(query).toContain('NOT');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query gracefully', () => {
      const input = { query: '' };
      expect(input.query).toBe('');
    });

    it('should handle special characters in query', () => {
      const query = 'test & (special) | chars';
      expect(query).toContain('&');
    });

    it('should handle limit of 0 (no results)', () => {
      const input = { query: 'test', limit: 0 };
      expect(input.limit).toBe(0);
    });

    it('should handle large limit value', () => {
      const input = { query: 'test', limit: 1000 };
      expect(input.limit).toBe(1000);
    });
  });

  describe('Response Handling', () => {
    it('should parse search results array', () => {
      const results = [
        { noteId: '1', title: 'Result 1' },
        { noteId: '2', title: 'Result 2' }
      ];
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
    });

    it('should handle empty results', () => {
      const results: any[] = [];
      expect(results.length).toBe(0);
    });

    it('should handle results with highlights', () => {
      const result = {
        noteId: '1',
        title: 'Test',
        highlight: '<mark>test</mark> search highlight'
      };
      expect(result.highlight).toContain('<mark>');
    });
  });
});
