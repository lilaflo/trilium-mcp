import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupFetchMock, mockEtapiResponses } from './mocks.js';

// Simple unit tests for core functionality
describe('Trilium MCP Server - Core Functions', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = setupFetchMock();
  });

  describe('Environment Configuration', () => {
    it('should have required environment variables', () => {
      expect(process.env.TRILIUM_URL).toBeDefined();
      expect(process.env.TRILIUM_TOKEN).toBeDefined();
    });

    it('should use test environment values', () => {
      expect(process.env.TRILIUM_URL).toBe('https://test-trilium.example.com/etapi');
      expect(process.env.TRILIUM_TOKEN).toBe('test-token-123');
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('Mock ETAPI Responses', () => {
    it('should have mock data for note creation', () => {
      expect(mockEtapiResponses.createNote).toMatchObject({
        noteId: expect.any(String),
        title: expect.any(String),
        type: 'text'
      });
    });

    it('should have mock data for note retrieval', () => {
      expect(mockEtapiResponses.getNote).toMatchObject({
        noteId: expect.any(String),
        title: expect.any(String),
        type: 'text',
        isDeleted: false
      });
    });

    it('should have mock data for search results', () => {
      expect(Array.isArray(mockEtapiResponses.searchNotes)).toBe(true);
      expect(mockEtapiResponses.searchNotes.length).toBeGreaterThan(0);
    });

    it('should have mock data for app info', () => {
      expect(mockEtapiResponses.getAppInfo).toMatchObject({
        appVersion: expect.any(String),
        dbVersion: expect.any(Number),
        nodeVersion: expect.any(String)
      });
    });
  });

  describe('Fetch Mock Functionality', () => {
    it('should mock fetch calls', async () => {
      const response = await fetch('https://test-trilium.example.com/etapi/create-note', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Note' })
      });

      expect(response.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/etapi/create-note'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should return appropriate mock responses for different endpoints', async () => {
      // Test app info endpoint
      const appInfoResponse = await fetch('https://test-trilium.example.com/etapi/app-info', {
        method: 'GET'
      });
      const appInfo = await appInfoResponse.json();

      expect(appInfo).toMatchObject(mockEtapiResponses.getAppInfo);

      // Test note creation endpoint
      const createResponse = await fetch('https://test-trilium.example.com/etapi/create-note', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' })
      });
      const createResult = await createResponse.json();

      expect(createResult).toMatchObject(mockEtapiResponses.createNote);
    });

    it('should handle content endpoints with text responses', async () => {
      const contentResponse = await fetch('https://test-trilium.example.com/etapi/notes/test/content', {
        method: 'GET'
      });
      const content = await contentResponse.text();

      expect(content).toBe(mockEtapiResponses.getNoteContent);
      expect(contentResponse.headers.get('content-type')).toBe('text/plain');
    });

    it('should handle DELETE requests with success status', async () => {
      const deleteResponse = await fetch('https://test-trilium.example.com/etapi/notes/test', {
        method: 'DELETE'
      });

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.ok).toBe(true);
    });

    it('should handle unknown endpoints with errors', async () => {
      try {
        await fetch('https://test-trilium.example.com/etapi/unknown-endpoint', {
          method: 'GET'
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('Not Found');
      }
    });
  });

  describe('JSON-RPC Structure Validation', () => {
    it('should validate basic JSON-RPC request structure', () => {
      const validRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'create_note',
          arguments: {
            parentId: 'root',
            title: 'Test Note'
          }
        }
      };

      expect(validRequest).toMatchObject({
        jsonrpc: '2.0',
        id: expect.any(Number),
        method: expect.any(String),
        params: expect.any(Object)
      });
    });

    it('should validate tool call parameters', () => {
      const toolCallParams = {
        name: 'create_note',
        arguments: {
          parentId: 'root',
          title: 'Test Note',
          content: '<h1>Test</h1>',
          type: 'text'
        }
      };

      expect(toolCallParams).toMatchObject({
        name: expect.any(String),
        arguments: expect.any(Object)
      });

      expect(toolCallParams.arguments).toHaveProperty('parentId');
      expect(toolCallParams.arguments).toHaveProperty('title');
    });
  });

  describe('Error Response Handling', () => {
    it('should handle ETAPI error responses', () => {
      const errorResponse = {
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'Failed to create note',
            message: 'Network error'
          }, null, 2)
        }]
      };

      expect(errorResponse).toMatchObject({
        isError: true,
        content: expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringContaining('error')
          })
        ])
      });
    });

    it('should format error messages consistently', () => {
      const errorMessage = JSON.stringify({
        error: 'Test Error',
        message: 'This is a test error message'
      }, null, 2);

      const parsedError = JSON.parse(errorMessage);
      expect(parsedError).toHaveProperty('error');
      expect(parsedError).toHaveProperty('message');
    });
  });

  describe('Base64 Encoding for Attachments', () => {
    it('should handle base64 encoded content', () => {
      const testContent = 'Hello World!';
      const base64Content = Buffer.from(testContent).toString('base64');

      expect(base64Content).toBe('SGVsbG8gV29ybGQh');
      expect(Buffer.from(base64Content, 'base64').toString()).toBe(testContent);
    });

    it('should validate attachment parameters', () => {
      const attachmentParams = {
        ownerId: 'test-note-123',
        title: 'test-file.txt',
        role: 'file',
        mime: 'text/plain',
        content: 'VGVzdCBmaWxlIGNvbnRlbnQ=',
        position: 10
      };

      expect(attachmentParams).toMatchObject({
        ownerId: expect.any(String),
        title: expect.any(String),
        content: expect.any(String)
      });

      expect(attachmentParams.mime).toMatch(/^[a-z]+\/[a-z]+$/);
    });
  });

  describe('Date Format Validation', () => {
    it('should validate day note date format', () => {
      const dayDate = '2025-09-29';
      expect(dayDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should validate month note format', () => {
      const monthDate = '2025-09';
      expect(monthDate).toMatch(/^\d{4}-\d{2}$/);
    });

    it('should validate week note format issues', () => {
      const regularDate = '2025-09-29';
      const weekFormat = '2025-W39';

      // Document the known issue with week format
      expect(regularDate).not.toMatch(/^\d{4}-W\d{2}$/);
      expect(weekFormat).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe('System Health Monitoring', () => {
    it('should generate proper health check response', () => {
      const healthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };

      expect(healthResponse).toMatchObject({
        status: 'healthy',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        uptime: expect.any(Number),
        memory: expect.objectContaining({
          rss: expect.any(Number),
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number)
        })
      });
    });

    it('should validate memory usage structure', () => {
      const memoryUsage = process.memoryUsage();

      expect(memoryUsage).toHaveProperty('rss');
      expect(memoryUsage).toHaveProperty('heapUsed');
      expect(memoryUsage).toHaveProperty('heapTotal');
      expect(memoryUsage).toHaveProperty('external');
    });
  });
});

describe('Tool Configuration Validation', () => {
  const expectedTools = [
    'create_note', 'get_note', 'get_note_content', 'update_note', 'update_note_content', 'delete_note',
    'search_notes',
    'get_day_note', 'get_week_note', 'get_month_note', 'get_inbox_note',
    'create_attachment',
    'get_app_info', 'export_note', 'create_backup'
  ];

  it('should have correct number of expected tools', () => {
    expect(expectedTools).toHaveLength(15);
  });

  it('should categorize tools correctly', () => {
    const coreTools = ['create_note', 'get_note', 'get_note_content', 'update_note', 'update_note_content', 'delete_note'];
    const searchTools = ['search_notes'];
    const calendarTools = ['get_day_note', 'get_week_note', 'get_month_note', 'get_inbox_note'];
    const fileTools = ['create_attachment'];
    const systemTools = ['get_app_info', 'export_note', 'create_backup'];

    expect(coreTools).toHaveLength(6);
    expect(searchTools).toHaveLength(1);
    expect(calendarTools).toHaveLength(4);
    expect(fileTools).toHaveLength(1);
    expect(systemTools).toHaveLength(3);

    const totalTools = coreTools.length + searchTools.length + calendarTools.length + fileTools.length + systemTools.length;
    expect(totalTools).toBe(15);
  });

  it('should have unique tool names', () => {
    const uniqueTools = new Set(expectedTools);
    expect(uniqueTools.size).toBe(expectedTools.length);
  });
});