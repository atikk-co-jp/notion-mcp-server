#!/usr/bin/env node

import { startServer } from "../src/server.js";

async function main(): Promise<void> {
  // Validate environment
  if (!process.env.NOTION_TOKEN) {
    console.error("Error: NOTION_TOKEN environment variable is required.");
    console.error("");
    console.error("To fix this:");
    console.error("1. Create a Notion integration at https://www.notion.so/my-integrations");
    console.error("2. Copy the Internal Integration Token");
    console.error("3. Set it as NOTION_TOKEN environment variable");
    console.error("");
    console.error("Example:");
    console.error('  NOTION_TOKEN="ntn_xxx..." npx notion-mcp-server');
    process.exit(1);
  }

  try {
    await startServer();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
