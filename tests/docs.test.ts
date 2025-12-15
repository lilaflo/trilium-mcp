import { describe, it, expect } from "@jest/globals";
import Fastify from "fastify";
import docsRoutes from "../routes/docs.js";

describe("Docs Routes", () => {
  describe("GET /docs", () => {
    it("should return HTML documentation", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("text/html");
      expect(response.body).toContain("trilium-mcp-server");
      expect(response.body).toContain("MCP server for Trilium Notes integration");
      expect(response.body).toContain("API Documentation");

      await fastify.close();
    });

    it("should include all tool categories", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("Note Management");
      expect(response.body).toContain("Search");
      expect(response.body).toContain("Calendar");
      expect(response.body).toContain("Attachments");
      expect(response.body).toContain("System");

      await fastify.close();
    });

    it("should include all 15 tools", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs",
      });

      expect(response.statusCode).toBe(200);

      // Note Management
      expect(response.body).toContain("create_note");
      expect(response.body).toContain("get_note");
      expect(response.body).toContain("get_note_content");
      expect(response.body).toContain("update_note");
      expect(response.body).toContain("update_note_content");
      expect(response.body).toContain("delete_note");

      // Search
      expect(response.body).toContain("search_notes");

      // Calendar
      expect(response.body).toContain("get_day_note");
      expect(response.body).toContain("get_week_note");
      expect(response.body).toContain("get_month_note");
      expect(response.body).toContain("get_inbox_note");

      // Attachments
      expect(response.body).toContain("create_attachment");

      // System
      expect(response.body).toContain("get_app_info");
      expect(response.body).toContain("export_note");
      expect(response.body).toContain("create_backup");

      await fastify.close();
    });

    it("should include examples for tools", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("Examples");
      expect(response.body).toContain("Request:");
      expect(response.body).toContain("Response:");

      await fastify.close();
    });

    it("should include warnings for known issues", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("⚠️");
      expect(response.body).toContain("Known issue");

      await fastify.close();
    });

    it("should include link to JSON endpoint", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs",
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain("/docs/json");
      expect(response.body).toContain("machine-readable");

      await fastify.close();
    });
  });

  describe("GET /mcp.json", () => {
    it("should return MCP manifest in JSON-RPC format", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/mcp.json",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("application/json");

      const json = JSON.parse(response.body);
      expect(json.jsonrpc).toBe("2.0");
      expect(json.result).toBeDefined();
      expect(json.result.tools).toBeDefined();
      expect(Array.isArray(json.result.tools)).toBe(true);

      await fastify.close();
    });

    it("should include all tools with inputSchema", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/mcp.json",
      });

      const json = JSON.parse(response.body);
      expect(json.result.tools.length).toBe(15);

      json.result.tools.forEach((tool: any) => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
        expect(tool.inputSchema.properties).toBeDefined();
        expect(tool.inputSchema.$schema).toBe(
          "http://json-schema.org/draft-07/schema#"
        );
      });

      await fastify.close();
    });

    it("should match tools/list JSON-RPC response format", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/mcp.json",
      });

      const json = JSON.parse(response.body);

      // Check it matches the MCP tools/list response structure
      expect(json).toHaveProperty("jsonrpc");
      expect(json).toHaveProperty("result");
      expect(json.result).toHaveProperty("tools");

      // Verify a specific tool structure
      const createNoteTool = json.result.tools.find(
        (t: any) => t.name === "create_note"
      );
      expect(createNoteTool).toBeDefined();
      expect(createNoteTool.inputSchema.properties.parentId).toBeDefined();
      expect(createNoteTool.inputSchema.required).toContain("parentId");
      expect(createNoteTool.inputSchema.required).toContain("title");

      await fastify.close();
    });
  });

  describe("GET /docs/json", () => {
    it("should return JSON documentation in OpenAPI format", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs/json",
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("application/json");

      const json = JSON.parse(response.body);
      expect(json.openapi).toBe("3.0.0");
      expect(json.info.title).toBe("trilium-mcp-server");
      expect(json.info.version).toBe("1.0.0");

      await fastify.close();
    });

    it("should include all tools as paths", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs/json",
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);

      expect(json.paths).toBeDefined();
      expect(Object.keys(json.paths).length).toBe(15);

      expect(json.paths["/tools/create_note"]).toBeDefined();
      expect(json.paths["/tools/get_note"]).toBeDefined();
      expect(json.paths["/tools/search_notes"]).toBeDefined();
      expect(json.paths["/tools/get_day_note"]).toBeDefined();
      expect(json.paths["/tools/create_attachment"]).toBeDefined();
      expect(json.paths["/tools/get_app_info"]).toBeDefined();
      expect(json.paths["/tools/export_note"]).toBeDefined();
      expect(json.paths["/tools/create_backup"]).toBeDefined();

      await fastify.close();
    });

    it("should include request schemas with parameters", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs/json",
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);

      const createNotePath = json.paths["/tools/create_note"];
      expect(createNotePath.post.requestBody).toBeDefined();
      expect(createNotePath.post.requestBody.content["application/json"].schema.properties).toBeDefined();
      expect(createNotePath.post.requestBody.content["application/json"].schema.properties.parentId).toBeDefined();
      expect(createNotePath.post.requestBody.content["application/json"].schema.properties.title).toBeDefined();
      expect(createNotePath.post.requestBody.content["application/json"].schema.required).toContain("parentId");
      expect(createNotePath.post.requestBody.content["application/json"].schema.required).toContain("title");

      await fastify.close();
    });

    it("should include response schemas", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs/json",
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);

      const createNotePath = json.paths["/tools/create_note"];
      expect(createNotePath.post.responses["200"]).toBeDefined();
      expect(createNotePath.post.responses["200"].content["application/json"]).toBeDefined();

      await fastify.close();
    });

    it("should include examples in request body", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs/json",
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);

      const createNotePath = json.paths["/tools/create_note"];
      expect(createNotePath.post.requestBody.content["application/json"].examples).toBeDefined();
      expect(createNotePath.post.requestBody.content["application/json"].examples.example1).toBeDefined();

      await fastify.close();
    });

    it("should include tags for categorization", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs/json",
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);

      expect(json.tags).toBeDefined();
      expect(json.tags.length).toBeGreaterThan(0);

      const tagNames = json.tags.map((t: any) => t.name);
      expect(tagNames).toContain("Note Management");
      expect(tagNames).toContain("Search");
      expect(tagNames).toContain("Calendar");
      expect(tagNames).toContain("Attachments");
      expect(tagNames).toContain("System");

      await fastify.close();
    });

    it("should include server information", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs/json",
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);

      expect(json.servers).toBeDefined();
      expect(json.servers.length).toBeGreaterThan(0);
      expect(json.servers[0].url).toBe("/mcp");

      await fastify.close();
    });

    it("should handle tools without parameters", async () => {
      const fastify = Fastify();
      await fastify.register(docsRoutes);

      const response = await fastify.inject({
        method: "GET",
        url: "/docs/json",
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);

      const appInfoPath = json.paths["/tools/get_app_info"];
      expect(appInfoPath.post.requestBody.content["application/json"].schema.properties).toBeDefined();

      await fastify.close();
    });
  });
});
