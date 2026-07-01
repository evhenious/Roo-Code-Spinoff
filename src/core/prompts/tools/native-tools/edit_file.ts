import type OpenAI from "openai"

const EDIT_FILE_DESCRIPTION = `Replace text in an existing file, or create a new file.

Key features:
- performs literal string replacement with support for multiple occurrences.
- normalizes line endings (CRLF/LF) for matching, but preserves original file's line endings when writing. 
- when an exact literal match fails, falls back to other matching strategies (exact → whitespace-tolerant match → token-based match). 

USAGE PATTERNS:

1. MODIFY EXISTING FILE (default):
   - Provide file_path, old_string (text to find), and new_string (replacement)

2. CREATE NEW FILE:
   - Set old_string to empty string ""
   - new_string becomes the entire file content
   - File must not already exist

CRITICAL REQUIREMENTS:

1. EXACT MATCHING (BEST): The old_string should match the file contents EXACTLY, including:
    - whitespace (spaces, tabs, newlines)
    - indentation
    - punctuation and special characters

2. CONTEXT FOR UNIQUENESS: For single replacements (default), include at least 3 lines of context BEFORE and AFTER the target text to ensure uniqueness.

3. NO ESCAPING: Provide the literal text - do not escape special characters.`

const edit_file = {
  type: "function",
  function: {
    name: "edit_file",
    description: EDIT_FILE_DESCRIPTION,
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description:
            "The path to the file to modify or create. Path is either a relative to the workspace or an absolute.",
        },
        old_string: {
          type: "string",
          description: "The text to find and replace. Must match file contents exactly.",
        },
        new_string: {
          type: "string",
          description: "The replacement text, or full content when creating a new file (set old_string to empty).",
        },
        expected_replacements: {
          type: "number",
          description: "Number of replacements expected. Defaults to 1.",
          minimum: 1,
        },
      },
      required: ["file_path", "old_string", "new_string"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool

export default edit_file
