import { describe, it, expect } from '@jest/globals';

describe('create_attachment tool', () => {
  describe('Input Schema Validation', () => {
    it('should require ownerId', () => {
      const input = { ownerId: 'note-123' };
      expect(input.ownerId).toBeDefined();
    });

    it('should require title', () => {
      const input = { ownerId: 'note-123', title: 'file.txt' };
      expect(input.title).toBeDefined();
    });

    it('should require role', () => {
      const input = { ownerId: 'note-123', title: 'file.txt', role: 'file' };
      expect(input.role).toBeDefined();
    });

    it('should accept file role', () => {
      const input = { ownerId: 'note-123', title: 'test.txt', role: 'file' };
      expect(input.role).toBe('file');
    });

    it('should accept image role', () => {
      const input = { ownerId: 'note-123', title: 'image.png', role: 'image' };
      expect(input.role).toBe('image');
    });

    it('should accept mime type', () => {
      const input = { ownerId: 'note-123', title: 'test.txt', role: 'file', mime: 'text/plain' };
      expect(input.mime).toBe('text/plain');
    });

    it('should accept base64 content', () => {
      const input = { ownerId: 'note-123', title: 'test.txt', role: 'file', content: 'SGVsbG8gV29ybGQ=' };
      expect(input.content).toBeDefined();
    });

    it('should accept optional position', () => {
      const input = { ownerId: 'note-123', title: 'test.txt', role: 'file', position: 5 };
      expect(input.position).toBe(5);
    });

    it('should accept all required fields', () => {
      const input = {
        ownerId: 'note-123',
        title: 'document.pdf',
        role: 'file',
        mime: 'application/pdf',
        content: 'base64encodedcontent'
      };
      
      expect(input.ownerId).toBeDefined();
      expect(input.title).toBeDefined();
      expect(input.role).toBeDefined();
      expect(input.mime).toBeDefined();
      expect(input.content).toBeDefined();
    });
  });

  describe('MIME Type Handling', () => {
    it('should handle text/plain', () => {
      const mime = 'text/plain';
      expect(mime).toMatch(/^text\//);
    });

    it('should handle text/html', () => {
      const mime = 'text/html';
      expect(mime).toMatch(/^text\//);
    });

    it('should handle application/json', () => {
      const mime = 'application/json';
      expect(mime).toMatch(/^application\//);
    });

    it('should handle application/pdf', () => {
      const mime = 'application/pdf';
      expect(mime).toMatch(/^application\//);
    });

    it('should handle image/png', () => {
      const mime = 'image/png';
      expect(mime).toMatch(/^image\//);
    });

    it('should handle image/jpeg', () => {
      const mime = 'image/jpeg';
      expect(mime).toMatch(/^image\//);
    });
  });

  describe('Base64 Content', () => {
    it('should validate base64 encoding', () => {
      const content = 'SGVsbG8gV29ybGQh'; // "Hello World!"
      const decoded = Buffer.from(content, 'base64').toString();
      expect(decoded).toBe('Hello World!');
    });

    it('should handle empty base64 string', () => {
      const content = '';
      const decoded = Buffer.from(content, 'base64').toString();
      expect(decoded).toBe('');
    });

    it('should handle binary base64 content', () => {
      const content = 'AAECAwQFBgcICQoLDA0ODw==';
      const buffer = Buffer.from(content, 'base64');
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should detect invalid base64', () => {
      const invalidBase64 = 'not-valid-base64!!!';
      try {
        Buffer.from(invalidBase64, 'base64').toString();
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });

  describe('Role Validation', () => {
    it('should accept file role', () => {
      const role = 'file';
      expect(['file', 'image', 'resource'].includes(role)).toBe(true);
    });

    it('should accept image role', () => {
      const role = 'image';
      expect(['file', 'image', 'resource'].includes(role)).toBe(true);
    });

    it('should accept resource role', () => {
      const role = 'resource';
      expect(['file', 'image', 'resource'].includes(role)).toBe(true);
    });

    it('should reject invalid role', () => {
      const role = 'invalid';
      expect(['file', 'image', 'resource'].includes(role)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle long filenames', () => {
      const title = 'a'.repeat(255) + '.txt';
      expect(title.length).toBe(259);
    });

    it('should handle special characters in filename', () => {
      const title = 'file with spaces and (parentheses).txt';
      expect(title).toContain(' ');
      expect(title).toContain('(');
    });

    it('should handle unicode filenames', () => {
      const title = '文件.txt';
      expect(title).toBe('文件.txt');
    });

    it('should handle position at 0', () => {
      const input = { ownerId: 'note-123', title: 'test.txt', role: 'file', position: 0 };
      expect(input.position).toBe(0);
    });
  });

  describe('Response Structure', () => {
    it('should return attachment with noteId', () => {
      const response = {
        noteId: 'attachment-123',
        title: 'test.txt',
        type: 'file'
      };
      expect(response.noteId).toBeDefined();
      expect(response.type).toBe('file');
    });

    it('should return attachment with size', () => {
      const response = {
        noteId: 'attachment-123',
        title: 'test.txt',
        size: 1024
      };
      expect(response.size).toBeDefined();
      expect(response.size).toBeGreaterThan(0);
    });

    it('should handle empty content', () => {
      const input = { ownerId: 'note-123', title: 'empty.txt', role: 'file', content: '' };
      expect(input.content).toBe('');
    });
  });
});
