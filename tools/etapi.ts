import fetch from "node-fetch";

// Ensure ETAPI_BASE always has the /etapi path
const ETAPI_BASE = process.env.TRILIUM_URL;
const AUTH = process.env.TRILIUM_TOKEN; // ETAPI token

export interface ETAPIOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function etapi(path: string, init: ETAPIOptions = {}): Promise<any> {
  const requestId = Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();

  const headers = {
    Authorization: `Basic ${Buffer.from(`etapi:${AUTH}`).toString("base64")}`,
    "Content-Type": "application/json",
    ...init.headers, // Allow overriding Content-Type and other headers
  };

  const url = `${ETAPI_BASE}${path}`;
  console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Starting ${init.method || "GET"} request to ${url}`);
  console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Request headers:`, JSON.stringify(headers, null, 2));
  if (init.body) {
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Request body:`, init.body);
  }

  try {
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Making fetch request`);
    const res = await fetch(url, {
      ...init,
      headers,
    });
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Fetch completed with status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const errorText = await res.text();
      const endTime = Date.now();
      console.error(`[${new Date().toISOString()}] [ETAPI-${requestId}] ETAPI error after ${endTime - startTime}ms: ${res.status} ${errorText}`);
      throw new Error(`ETAPI request failed: ${res.status} ${errorText}`);
    }

    // Handle content endpoints that return plain text/html
    if (path.includes('/content')) {
      console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Parsing response as text (content endpoint)`);
      const textResult = await res.text();
      const endTime = Date.now();
      console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] ETAPI request completed successfully in ${endTime - startTime}ms`);
      console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Response content length: ${textResult.length} characters`);
      return textResult;
    }

    // Handle empty responses (like DELETE operations)
    const contentLength = res.headers.get('content-length');
    if (contentLength === '0' || res.status === 204) {
      console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Empty response (${res.status}), returning null`);
      const endTime = Date.now();
      console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] ETAPI request completed successfully in ${endTime - startTime}ms`);
      return null;
    }

    // Default JSON parsing
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Parsing response as JSON`);
    const jsonResult = await res.json();
    const endTime = Date.now();
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] ETAPI request completed successfully in ${endTime - startTime}ms`);
    console.log(`[${new Date().toISOString()}] [ETAPI-${requestId}] Response:`, JSON.stringify(jsonResult, null, 2));
    return jsonResult;
  } catch (error) {
    const endTime = Date.now();
    console.error(`[${new Date().toISOString()}] [ETAPI-${requestId}] Request failed after ${endTime - startTime}ms:`, error);
    throw error;
  }
}

export function formatError(toolName: string, error: unknown): { content: any[]; isError: boolean } {
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

export function formatSuccess(message: string, data: any = {}): { content: any[] } {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: true,
        message,
        ...data
      }, null, 2)
    }]
  };
}