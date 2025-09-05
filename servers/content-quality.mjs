import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { JSDOM } from "jsdom";
import Readability from "@mozilla/readability";
import textReadability from "text-readability";
const { fleschKincaidGrade } = textReadability;

const server = new McpServer({ name: "content-quality", version: "1.0.0" });

server.tool("audit", {
  description: "Lightweight on-page content audit",
  inputSchema: { type: "object", properties: { url: { type: "string" } }, required: ["url"] },
  async handler({ url }) {
    const html = await (await fetch(url)).text();
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    // Main article extraction
    const article = new Readability(doc).parse();
    const text = article?.textContent || doc.body.textContent || "";
    const grade = fleschKincaidGrade(text || ""); // lower is easier

    // Simple checks
    const h1 = doc.querySelector("h1")?.textContent?.trim() || "";
    const title = doc.querySelector("title")?.textContent?.trim() || "";
    const metaDesc = doc.querySelector("meta[name='description']")?.getAttribute("content") || "";
    const images = [...doc.querySelectorAll("img")];
    const withAlt = images.filter(i => i.getAttribute("alt")).length;
    const jsonLd = [...doc.querySelectorAll("script[type='application/ld+json']")].map(s => s.textContent);

    // Normalise to a 0-100 score with simple weighting
    let score = 100;
    if (!h1) score -= 10;
    if (!metaDesc) score -= 10;
    if (!title || title.length < 15) score -= 5;
    if (images.length && withAlt / images.length < 0.7) score -= 10;
    if (!jsonLd.length) score -= 5;
    if (grade > 14) score -= 10;

    const issues = [];
    if (!h1) issues.push("Missing H1");
    if (!metaDesc) issues.push("Missing meta description");
    if (images.length && withAlt / images.length < 0.7) issues.push("Low image alt coverage");
    if (!jsonLd.length) issues.push("No JSON-LD detected");
    if (grade > 14) issues.push(`High reading grade ${grade.toFixed(1)}`);

    return { 
      score: Math.max(0, Math.round(score)), 
      title, 
      h1, 
      metaDescLength: metaDesc.length, 
      imageAltCoverage: withAlt + "/" + images.length, 
      readingGrade: grade, 
      issues 
    };
  }
});

await server.connect(new StdioServerTransport());