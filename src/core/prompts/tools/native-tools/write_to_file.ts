import type OpenAI from "openai"

const WRITE_TO_FILE_DESCRIPTION = `Write content to a file. Creates or overwrites files automatically, including parent directories.

**Prefer other editing tools for changes to existing files — this tool is slower and cannot handle large files. Use primarily for new file creation.**

When using this tool, you MUST provide the WHOLE and COMPLETE file content. Partial updates or placeholders are strictly forbidden and will result in broken code. NEVER include line numbers. 

When creating a new project, organize all new files within a dedicated project directory unless the user specifies otherwise. Structure the project logically, adhering to best practices for the specific type of project being created.

Example: Writing a configuration file
{ "path": "frontend-config.json", "content": "{\\n  \\"apiEndpoint\\": \\"https://api.example.com\\",\\n  \\"theme\\": {\\n    \\"primaryColor\\": \\"#007bff\\"\\n  }\\n}" }`

const PATH_PARAMETER_DESCRIPTION = `File path, relative to the workspace.`

const CONTENT_PARAMETER_DESCRIPTION = `Complete file content — all parts, even unchanged. No placeholders or line numbers.`

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
