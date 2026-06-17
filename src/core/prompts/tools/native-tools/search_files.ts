import type OpenAI from "openai"

const SEARCH_FILES_DESCRIPTION = `Perform a regex search across files in a directory. Results include surrounding context.

Parameters:
- path: (required) Directory to search in, relative to the workspace. Searched recursively.
- regex: (required) Regular expression pattern to search for (Rust regex syntax).
- file_pattern: (optional) Glob pattern to filter files (e.g., '*.ts'). Searches in all files if not provided.

Example: Searching for function definitions in JavaScript files
{ "path": "src", "regex": "function\\s+\\w+", "file_pattern": "*.js" }`

const PATH_PARAMETER_DESCRIPTION = `Directory to search recursively, relative to the workspace`

const REGEX_PARAMETER_DESCRIPTION = `Regular expression pattern (Rust regex syntax)`

const FILE_PATTERN_PARAMETER_DESCRIPTION = `Optional glob pattern to filter files`

export default {
  type: "function",
  function: {
    name: "search_files",
    description: SEARCH_FILES_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: PATH_PARAMETER_DESCRIPTION,
        },
        regex: {
          type: "string",
          description: REGEX_PARAMETER_DESCRIPTION,
        },
        file_pattern: {
          type: ["string", "null"],
          description: FILE_PATTERN_PARAMETER_DESCRIPTION,
        },
      },
      required: ["path", "regex", "file_pattern"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
