import type OpenAI from "openai"

const EDIT_DESCRIPTION = `Performs exact string replacements in files.

Usage:
- You must use your \`Read\` tool at least once in the conversation before editing. This tool will error if you attempt an edit without reading the file.
- When editing text from Read tool output, ensure you preserve the exact indentation (tabs/spaces) as it appears AFTER the line number prefix. The line number prefix format is: spaces + line number + tab. Everything after that tab is the actual file content to match. Never include any part of the line number prefix in the old_string or new_string.
- Prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
- Avoid adding emojis to files unless explicitly asked.
- The edit will FAIL if \`old_string\` is not unique in the file. Either provide a larger string with more surrounding context to make it unique or use \`replace_all\` to change every instance of \`old_string\`.
- Use \`replace_all\` for replacing multiple strings across the file. Useful if you want to rename a variable, for instance.`

const edit = {
  type: "function",
  function: {
    name: "edit",
    description: EDIT_DESCRIPTION,
    parameters: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file (relative to the working directory)",
        },
        old_string: {
          type: "string",
          description:
            "The text to find and replace. Must match exactly including whitespaces, indentation and line endings.",
        },
        new_string: {
          type: "string",
          description: "The replacement text for old_string. Must include all necessary whitespaces and indentation.",
        },
        replace_all: {
          type: "boolean",
          description:
            "true for replacing ALL occurrences of old_string. false (default) to replace the first occurrence; errors if multiple matches exist.",
          default: false,
        },
      },
      required: ["file_path", "old_string", "new_string"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool

export default edit
