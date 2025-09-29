import { jest } from '@jest/globals';

// Mock ETAPI responses
export const mockEtapiResponses = {
  createNote: {
    noteId: 'test-note-123',
    title: 'Test Note',
    parentId: 'root',
    type: 'text',
    isDeleted: false,
    mime: 'text/html',
    isProtected: false
  },

  getNote: {
    noteId: 'test-note-123',
    title: 'Test Note',
    type: 'text',
    mime: 'text/html',
    isDeleted: false,
    isProtected: false,
    parentIds: ['root'],
    childIds: [],
    attributeIds: [],
    labels: [],
    relations: []
  },

  getNoteContent: '<h1>Test Content</h1><p>This is test content.</p>',

  searchNotes: [
    {
      noteId: 'search-result-1',
      title: 'Search Result 1',
      type: 'text',
      isDeleted: false
    },
    {
      noteId: 'search-result-2',
      title: 'Search Result 2',
      type: 'text',
      isDeleted: false
    }
  ],

  getAppInfo: {
    appVersion: '0.98.0',
    dbVersion: 233,
    dataDirectory: '/opt/trilium-data',
    buildDate: '2024-01-01',
    buildRevision: 'abc123',
    hostname: 'test-trilium',
    port: 8080,
    isPasswordSet: true,
    nodeVersion: 'v22.18.0'
  },

  getDayNote: {
    noteId: 'day-note-123',
    title: '2025-09-29',
    type: 'text',
    mime: 'text/html',
    isDeleted: false,
    attributeIds: ['attr-1'],
    attributes: [
      {
        attributeId: 'attr-1',
        type: 'label',
        name: 'dateNote',
        value: '2025-09-29'
      }
    ]
  },

  getMonthNote: {
    noteId: 'month-note-123',
    title: '2025-09',
    type: 'text',
    mime: 'text/html',
    isDeleted: false,
    childIds: ['day-note-1', 'day-note-2']
  },

  createAttachment: {
    noteId: 'attachment-123',
    title: 'test-file.txt',
    type: 'file',
    mime: 'text/plain',
    size: 24,
    isDeleted: false
  }
};

// Mock fetch function for ETAPI calls
export function mockFetch(url: string, options?: RequestInit): Promise<Response> {
  const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;

  // Determine response based on URL and method
  if (url.includes('/etapi/create-note') && options?.method === 'POST') {
    fetchMock.mockResolvedValueOnce(createMockResponse(mockEtapiResponses.createNote));
  } else if (url.includes('/etapi/notes/') && options?.method === 'GET' && url.endsWith('/content')) {
    fetchMock.mockResolvedValueOnce(createMockResponse(mockEtapiResponses.getNoteContent, 'text/plain'));
  } else if (url.includes('/etapi/notes/') && options?.method === 'GET') {
    fetchMock.mockResolvedValueOnce(createMockResponse(mockEtapiResponses.getNote));
  } else if (url.includes('/etapi/notes/') && options?.method === 'PATCH') {
    fetchMock.mockResolvedValueOnce(createMockResponse(mockEtapiResponses.getNote));
  } else if (url.includes('/etapi/notes/') && options?.method === 'PUT' && url.endsWith('/content')) {
    fetchMock.mockResolvedValueOnce(createMockResponse('', 'text/plain', 204));
  } else if (url.includes('/etapi/notes/') && options?.method === 'DELETE') {
    fetchMock.mockResolvedValueOnce(createMockResponse('', 'text/plain', 200));
  } else if (url.includes('/etapi/search/') && options?.method === 'GET') {
    fetchMock.mockResolvedValueOnce(createMockResponse(mockEtapiResponses.searchNotes));
  } else if (url.includes('/etapi/app-info') && options?.method === 'GET') {
    fetchMock.mockResolvedValueOnce(createMockResponse(mockEtapiResponses.getAppInfo));
  } else if (url.includes('/etapi/calendar/days/') && options?.method === 'GET') {
    fetchMock.mockResolvedValueOnce(createMockResponse(mockEtapiResponses.getDayNote));
  } else if (url.includes('/etapi/calendar/months/') && options?.method === 'GET') {
    fetchMock.mockResolvedValueOnce(createMockResponse(mockEtapiResponses.getMonthNote));
  } else if (url.includes('/etapi/calendar/weeks/') && options?.method === 'GET') {
    fetchMock.mockRejectedValueOnce(new Error('Week \'2025-09-29\' is not valid'));
  } else if (url.includes('/etapi/create-note') && options?.method === 'POST' && typeof options.body === 'string' && options.body.includes('"type":"file"')) {
    fetchMock.mockResolvedValueOnce(createMockResponse(mockEtapiResponses.createAttachment));
  } else if (url.includes('/etapi/backup/') && options?.method === 'PUT') {
    fetchMock.mockResolvedValueOnce(createMockResponse('', 'text/plain', 204));
  } else if (url.includes('/etapi/export/') && options?.method === 'GET') {
    // Mock binary ZIP response
    const mockZipData = new Uint8Array([80, 75, 3, 4]); // ZIP file header
    fetchMock.mockResolvedValueOnce(createMockResponse(mockZipData, 'application/zip'));
  } else {
    // Default 404 for unknown endpoints
    fetchMock.mockRejectedValueOnce(new Error('Not Found'));
  }

  return fetchMock(url, options);
}

// Helper to create mock Response objects
function createMockResponse(data: any, contentType = 'application/json', status = 200): Response {
  const responseInit: ResponseInit = {
    status,
    statusText: status === 200 ? 'OK' : status === 204 ? 'No Content' : 'Error',
    headers: {
      'Content-Type': contentType
    }
  };

  let body: string | ArrayBuffer;
  if (data instanceof Uint8Array) {
    body = data.buffer as ArrayBuffer;
  } else if (contentType === 'text/plain') {
    body = typeof data === 'string' ? data : '';
  } else {
    body = JSON.stringify(data);
  }

  return new Response(body, responseInit);
}

// Setup fetch mock for a test
export function setupFetchMock() {
  const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
  fetchMock.mockImplementation(mockFetch);
  return fetchMock;
}