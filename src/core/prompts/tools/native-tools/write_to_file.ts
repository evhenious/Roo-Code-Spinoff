import type OpenAI from "openai"

const WRITE_TO_FILE_DESCRIPTION = `Write content to a file. Creates or overwrites files automatically, including parent directories.

**Prefer other editing tools for changes to existing files — this tool is slower and cannot handle large files. Use primarily for new file creation.**

IMPORTANT: When using this tool, ALWAYS provide FULL and COMPLETE file content. Partial updates, placeholders or line numbers are strictly forbidden and will result in broken code. 

When creating a new project, organize all new files within a dedicated project directory unless the user specifies otherwise. Structure the project logically, adhering to best practices for the specific type of project being created.`

const PATH_PARAMETER_DESCRIPTION = `File path, relative to the workspace`

const CONTENT_PARAMETER_DESCRIPTION = `File content`

export default {
  type: "function",
  function: {
    name: "write_to_file",
    description: WRITE_TO_FILE_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: PATH_PARAMETER_DESCRIPTION,
        },
        content: {
          type: "string",
          description: CONTENT_PARAMETER_DESCRIPTION,
        },
      },
      required: ["path", "content"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
