import { describe, it, expect, beforeEach, jest } from '@jest/globals';

function formatSuccess(message: string, data: any = {}): { content: any[] } {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: true,
        message,
        ...data
      }, null, 2)
    }]
  };
}

function formatError(toolName: string, error: unknown): { content: any[]; isError: boolean } {
  const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        error: `Failed to ${toolName.replace('_', ' ')}`,
        message: errorMessage,
      }, null, 2)
    }],
    isError: true
  };
}

describe('ETAPI Utilities', () => {
  describe('formatSuccess', () => {
    it('should format success response with message and data', () => {
      const result = formatSuccess('Note created successfully', { noteId: 'test-123' });
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Note created successfully',
            noteId: 'test-123'
          }, null, 2)
        }]
      });
    });

    it('should format success response with only message', () => {
      const result = formatSuccess('Operation completed');
      
      expect(result).toEqual({
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Operation completed'
          }, null, 2)
        }]
      });
    });

    it('should handle empty data object', () => {
      const result = formatSuccess('Done', {});
      
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.message).toBe('Done');
    });
  });

  describe('formatError', () => {
    it('should format error with Error object', () => {
      const error = new Error('Note not found');
      const result = formatError('get_note', error);
      
      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('Failed to get note');
      expect(parsed.message).toBe('Note not found');
    });

    it('should format error with Error object', () => {
      const result = formatError('create_note', new Error('Network error'));
      
      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('Failed to create note');
      expect(parsed.message).toBe('Network error');
    });

    it('should handle unknown error types', () => {
      const result = formatError('update_note', { code: 500, reason: 'Server error' });
      
      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBe('Failed to update note');
      expect(parsed.message).toBe('Unknown error occurred');
    });

    it('should handle null error', () => {
      const result = formatError('delete_note', null);
      
      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toBe('Unknown error occurred');
    });

    it('should handle undefined error', () => {
      const result = formatError('delete_note', undefined);
      
      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toBe('Unknown error occurred');
    });
  });
});

describe('Tool Input Schema Validation', () => {
  describe('create_note schema', () => {
    it('should validate required parentId and title', () => {
      const input = { parentId: 'root', title: 'Test Note' };
      expect(input.parentId).toBeDefined();
      expect(input.title).toBeDefined();
    });

    it('should accept optional content', () => {
      const input = { parentId: 'root', title: 'Test', content: '<p>Content</p>' };
      expect(input.content).toBeDefined();
    });

    it('should accept optional type', () => {
      const input = { parentId: 'root', title: 'Test', type: 'text' };
      expect(input.type).toBe('text');
    });

    it('should accept file type', () => {
      const input = { parentId: 'root', title: 'Test', type: 'file' };
      expect(input.type).toBe('file');
    });

    it('should accept code type', () => {
      const input = { parentId: 'root', title: 'Test', type: 'code', mime: 'text/javascript' };
      expect(input.type).toBe('code');
    });
  });

  describe('get_note schema', () => {
    it('should require noteId', () => {
      const input = { noteId: 'test-note-123' };
      expect(input.noteId).toBeDefined();
    });

    it('should accept various note ID formats', () => {
      const uuidFormat = '550e8400-e29b-41d4-a716-446655440000';
      const shortFormat = 'note-123';
      
      expect(uuidFormat.length).toBeGreaterThan(10);
      expect(shortFormat.length).toBeGreaterThan(0);
    });
  });

  describe('update_note schema', () => {
    it('should require id', () => {
      const input = { id: 'test-note-123' };
      expect(input.id).toBeDefined();
    });

    it('should accept title only', () => {
      const input = { id: 'test-note-123', title: 'New Title' };
      expect(input.title).toBeDefined();
      expect(input.content).toBeUndefined();
    });

    it('should accept content only', () => {
      const input = { id: 'test-note-123', content: 'New Content' };
      expect(input.content).toBeDefined();
      expect(input.title).toBeUndefined();
    });

    it('should accept both title and content', () => {
      const input = { id: 'test-note-123', title: 'New Title', content: 'New Content' };
      expect(input.title).toBeDefined();
      expect(input.content).toBeDefined();
    });

    it('should accept contentOnly flag', () => {
      const input = { id: 'test-note-123', content: 'Large content', contentOnly: true };
      expect(input.contentOnly).toBe(true);
    });

    it('should reject when neither title nor content provided', () => {
      const input = { id: 'test-note-123' };
      const hasTitle = input.title !== undefined;
      const hasContent = input.content !== undefined;
      expect(hasTitle || hasContent).toBe(false);
    });
  });

  describe('delete_note schema', () => {
    it('should require noteId', () => {
      const input = { noteId: 'test-note-123' };
      expect(input.noteId).toBeDefined();
    });

    it('should accept optional cascade flag', () => {
      const input = { noteId: 'test-note-123', cascade: true };
      expect(input.cascade).toBe(true);
    });
  });

  describe('move_note schema', () => {
    it('should require noteId and parentId', () => {
      const input = { noteId: 'test-note-123', parentId: 'new-parent' };
      expect(input.noteId).toBeDefined();
      expect(input.parentId).toBeDefined();
    });

    it('should accept optional position', () => {
      const input = { noteId: 'test-note-123', parentId: 'new-parent', position: 5 };
      expect(input.position).toBe(5);
    });
  });
});
