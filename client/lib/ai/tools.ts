/**
 * Tool registry — future home for all tool definitions.
 *
 * When you're ready to add tools:
 * 1. Define your tool using the Vercel AI SDK `tool()` helper.
 * 2. Add it to TOOL_REGISTRY below.
 * 3. Reference the tool ID in src/constants/modes.ts for the relevant mode(s).
 * 4. Pass activeTools() into the `tools` option of streamText() in the API route.
 *
 * Example (uncomment when ready):
 *
 * import { tool } from "ai";
 * import { z } from "zod";
 *
 * const webSearchTool = tool({
 *   description: "Search the web for up-to-date information",
 *   parameters: z.object({ query: z.string() }),
 *   execute: async ({ query }) => { ... },
 * });
 */

import type { ToolSet } from "ai";

export const TOOL_REGISTRY: ToolSet = {
  // web_search: webSearchTool,
  // code_execution: codeExecutionTool,
  // file_ops: fileOpsTool,
};

/**
 * Returns the subset of tools that should be active for a given list of tool IDs.
 */
export function activeTools(toolIds: string[]): ToolSet {
  return Object.fromEntries(
    toolIds
      .filter((id) => id in TOOL_REGISTRY)
      .map((id) => [id, TOOL_REGISTRY[id]])
  ) as ToolSet;
}
