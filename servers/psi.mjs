import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({ name: "psi", version: "1.0.0" });

server.tool("runPagespeed", {
  description: "Call PSI v5 for a URL",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string" },
      strategy: { type: "string", enum: ["mobile", "desktop"] }
    },
    required: ["url", "strategy"]
  },
  async handler({ url, strategy }) {
    const key = process.env.GOOGLE_PSI_API_KEY;
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("strategy", strategy);
    ["performance", "accessibility", "seo"].forEach(c => endpoint.searchParams.append("category", c));
    if (key) endpoint.searchParams.set("key", key);

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`PSI error ${res.status}`);
    const json = await res.json();

    return {
      categories: json.lighthouseResult?.categories,
      audits: {
        fcp: json.lighthouseResult?.audits["first-contentful-paint"],
        lcp: json.lighthouseResult?.audits["largest-contentful-paint"],
        tbt: json.lighthouseResult?.audits["total-blocking-time"],
        cls: json.lighthouseResult?.audits["cumulative-layout-shift"],
        tti: json.lighthouseResult?.audits["interactive"]
      }
    };
  }
});

await server.connect(new StdioServerTransport());