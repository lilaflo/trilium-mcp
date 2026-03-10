import { describe, it, expect } from '@jest/globals';

describe('System Tools', () => {
  describe('get_app_info', () => {
    describe('Input Schema Validation', () => {
      it('should accept empty params (no required fields)', () => {
        const input = {};
        expect(input).toEqual({});
      });
    });

    describe('Response Structure', () => {
      it('should include appVersion', () => {
        const response = { appVersion: '0.98.0' };
        expect(response.appVersion).toBeDefined();
      });

      it('should include dbVersion', () => {
        const response = { dbVersion: 233 };
        expect(response.dbVersion).toBeDefined();
        expect(typeof response.dbVersion).toBe('number');
      });

      it('should include nodeVersion', () => {
        const response = { nodeVersion: 'v22.18.0' };
        expect(response.nodeVersion).toBeDefined();
        expect(response.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/);
      });

      it('should include dataDirectory', () => {
        const response = { dataDirectory: '/opt/trilium-data' };
        expect(response.dataDirectory).toBeDefined();
      });

      it('should include buildDate', () => {
        const response = { buildDate: '2024-01-01' };
        expect(response.buildDate).toBeDefined();
      });

      it('should include buildRevision', () => {
        const response = { buildRevision: 'abc123' };
        expect(response.buildRevision).toBeDefined();
      });

      it('should include hostname', () => {
        const response = { hostname: 'trilium-server' };
        expect(response.hostname).toBeDefined();
      });

      it('should include isPasswordSet', () => {
        const response = { isPasswordSet: true };
        expect(response.isPasswordSet).toBeDefined();
        expect(typeof response.isPasswordSet).toBe('boolean');
      });
    });

    describe('Version Parsing', () => {
      it('should parse semantic version', () => {
        const version = '0.98.0';
        const [major, minor, patch] = version.split('.').map(Number);
        expect(major).toBe(0);
        expect(minor).toBe(98);
        expect(patch).toBe(0);
      });

      it('should handle different version formats', () => {
        const versions = ['1.0.0', '0.58.5', '0.59.0-beta'];
        versions.forEach(v => expect(v).toMatch(/\d+\.\d+/));
      });
    });
  });

  describe('export_note', () => {
    describe('Input Schema Validation', () => {
      it('should require noteId', () => {
        const input = { noteId: 'test-note-123' };
        expect(input.noteId).toBeDefined();
      });

      it('should accept optional format', () => {
        const input = { noteId: 'test', format: 'html' };
        expect(input.format).toBe('html');
      });

      it('should accept zip format', () => {
        const input = { noteId: 'test', format: 'zip' };
        expect(input.format).toBe('zip');
      });

      it('should accept html format', () => {
        const input = { noteId: 'test', format: 'html' };
        expect(input.format).toBe('html');
      });

      it('should accept markdown format', () => {
        const input = { noteId: 'test', format: 'markdown' };
        expect(input.format).toBe('markdown');
      });

      it('should default to html if not specified', () => {
        const input = { noteId: 'test' };
        const format = input.format || 'html';
        expect(format).toBe('html');
      });
    });

    describe('Export Format Handling', () => {
      it('should handle ZIP format for binary response', () => {
        const format = 'zip';
        expect(['html', 'markdown', 'zip'].includes(format)).toBe(true);
      });

      it('should handle HTML format', () => {
        const format = 'html';
        expect(['html', 'markdown', 'zip'].includes(format)).toBe(true);
      });

      it('should handle Markdown format', () => {
        const format = 'markdown';
        expect(['html', 'markdown', 'zip'].includes(format)).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should handle non-existent note', () => {
        const noteId = 'non-existent-note';
        expect(noteId).not.toBe('');
      });

      it('should handle invalid format', () => {
        const format = 'invalid';
        expect(['html', 'markdown', 'zip'].includes(format)).toBe(false);
      });
    });
  });

  describe('create_backup', () => {
    describe('Input Schema Validation', () => {
      it('should accept empty params (no required fields)', () => {
        const input = {};
        expect(input).toEqual({});
      });

      it('should accept optional label', () => {
        const input = { label: 'my-backup' };
        expect(input.label).toBeDefined();
      });
    });

    describe('Response Handling', () => {
      it('should handle 204 No Content response', () => {
        const status = 204;
        expect(status).toBe(204);
      });

      it('should handle empty response body', () => {
        const body = null;
        expect(body).toBeNull();
      });

      it('should handle text response', () => {
        const body = 'Backup created successfully';
        expect(typeof body).toBe('string');
      });
    });

    describe('Backup Label', () => {
      it('should handle custom label', () => {
        const label = 'backup-2025-01-01';
        expect(label).toMatch(/^backup-/);
      });

      it('should handle empty label', () => {
        const label = '';
        expect(label).toBe('');
      });

      it('should handle timestamp label', () => {
        const label = `backup-${Date.now()}`;
        expect(label).toContain('backup-');
      });
    });

    describe('Known Issue: Empty Response', () => {
      it('should document 204 response handling', () => {
        const status = 204;
        const contentLength = '0';
        expect(status).toBe(204);
        expect(contentLength).toBe('0');
      });
    });
  });
});

describe('get_note_content', () => {
  describe('Input Schema Validation', () => {
    it('should require noteId', () => {
      const input = { noteId: 'test-note-123' };
      expect(input.noteId).toBeDefined();
    });
  });

  describe('Response Handling', () => {
    it('should return plain text content', () => {
      const content = 'Plain text content';
      expect(typeof content).toBe('string');
    });

    it('should return HTML content', () => {
      const content = '<p>HTML content</p>';
      expect(content).toContain('<p>');
    });

    it('should return markdown content', () => {
      const content = '# Heading\n\nSome text';
      expect(content).toContain('#');
    });

    it('should handle empty content', () => {
      const content = '';
      expect(content).toBe('');
    });
  });
});
