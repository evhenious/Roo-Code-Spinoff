import type OpenAI from "openai"

const SEARCH_REPLACE_DESCRIPTION = `Search and replace operation on an existing file.

The tool will replace ONE occurrence of old_string with new_string in the specified file.

CRITICAL REQUIREMENTS:

1. UNIQUENESS: The old_string MUST uniquely identify the specific instance you want to change:
   - Include AT LEAST 3-5 lines of context BEFORE the change point
   - Include AT LEAST 3-5 lines of context AFTER the change point
   - Include all whitespace, indentation, and surrounding code exactly as it appears in the file

2. SINGLE INSTANCE: This tool can only change ONE instance at a time. To change multiple instances:
   - Make separate calls to this tool for each instance
   - Each call must uniquely identify its specific instance using extensive context

3. VERIFICATION: Before using this tool:
   - If multiple instances exist, gather enough context to uniquely identify each one
   - Plan separate tool calls for each instance`

const search_replace = {
  type: "function",
  function: {
    name: "search_replace",
    description: SEARCH_REPLACE_DESCRIPTION,
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file. Path is either a relative to the workspace or an absolute.",
        },
        old_string: {
          type: "string",
          description: "The text to find and replace",
        },
        new_string: {
          type: "string",
          description: "The text to replace the old_string with",
        },
      },
      required: ["file_path", "old_string", "new_string"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool

export default search_replace
