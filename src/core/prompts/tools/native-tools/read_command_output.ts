import type OpenAI from "openai"

/**
 * Native tool definition for read_command_output.
 *
 * This tool allows the LLM to retrieve full command output that was truncated
 * during execute_command. When command output exceeds the preview threshold,
 * the full output is persisted to disk and an artifact_id is provided. The
 * LLM can then use this tool to read the full content or search within it.
 */

const READ_COMMAND_OUTPUT_DESCRIPTION = `Retrieve full output from a command that was truncated during execute_command.

When to Use:
- The execute_command result shows "[OUTPUT TRUNCATED - Full output saved to artifact: cmd-XXXX.txt]"
- You need to see more of the command output beyond the preview
- You want to search for specific content in large command output

Modes:
- Read mode (default): Read output with optional byte offset and limit for pagination
- Search mode: Filter lines matching a regex or literal pattern (like grep) — set the search parameter to use

Do not use when:
- Command output was not truncated (no artifact message in the result)
- You already have the full output from execute_command

Examples:
1. Read full output: { "artifact_id": "cmd-1706119234567.txt" }
2. Pagination (after first 40KB): { "artifact_id": "cmd-1706119234567.txt", "offset": 40960 }
3. Search for errors: { "artifact_id": "cmd-1706119234567.txt", "search": "error|failed|Error" }
4. Find test failures: { "artifact_id": "cmd-1706119234567.txt", "search": "FAIL" }`

const ARTIFACT_ID_DESCRIPTION = `Artifact filename from the truncated command output (e.g., "cmd-1706119234567.txt")`

const SEARCH_DESCRIPTION = `Regex or literal pattern to filter lines (case-insensitive, like grep). Omit entirely if not searching - do not pass null or empty string.`

const OFFSET_DESCRIPTION = `Byte offset for pagination (default: 0)`

const LIMIT_DESCRIPTION = `Maximum bytes to return (default: 40KB)`

export default {
  type: "function",
  function: {
    name: "read_command_output",
    description: READ_COMMAND_OUTPUT_DESCRIPTION,
    // Note: strict mode is intentionally disabled for this tool.
    // With strict: true, OpenAI requires ALL properties to be in the 'required' array,
    // which forces the LLM to always provide explicit values (even null) for optional params.
    // This creates verbose tool calls and poor UX. By disabling strict mode, the LLM can
    // omit optional parameters entirely, making the tool easier to use.
    parameters: {
      type: "object",
      properties: {
        artifact_id: {
          type: "string",
          description: ARTIFACT_ID_DESCRIPTION,
        },
        search: {
          type: "string",
          description: SEARCH_DESCRIPTION,
        },
        offset: {
          type: "number",
          description: OFFSET_DESCRIPTION,
        },
        limit: {
          type: "number",
          description: LIMIT_DESCRIPTION,
        },
      },
      required: ["artifact_id"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
