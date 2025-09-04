import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "crux", version: "1.0.0" });

server.tool("query", {
  description: "CrUX field data - page or origin",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string" },
      origin: { type: "string" },
      formFactor: { type: "string", enum: ["PHONE", "DESKTOP"] }
    }
  },
  async handler({ url, origin, formFactor = "PHONE" }) {
    const key = process.env.GOOGLE_CRUX_API_KEY;
    const q = { formFactor, metrics: ["largest_contentful_paint", "interaction_to_next_paint", "cumulative_layout_shift"] };
    if (url) q.url = url;
    if (origin) q.origin = origin;

    const endpoint = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${key}`;
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
    const json = await res.json();

    // If page-level returns no record, caller should retry with origin
    return json.record || null;
  }
});

await server.connect(new StdioServerTransport());