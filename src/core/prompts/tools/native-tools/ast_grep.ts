import type OpenAI from "openai"

const AST_GREP_DESCRIPTION = `Search code using AST (Abstract Syntax Tree) patterns via ast-grep (sg). Finds code based on structural patterns rather than plain text matching.

When to Use:
- Finding code constructs by structure: function definitions, class usages, method calls, imports
- Matching patterns with wildcards and named captures (e.g., all React hooks, all useEffect calls with dependencies)
- Searching across multiple file types with language-aware AST parsing

Do not use when:
- You need simple text or regex search — use search_files instead
- Searching for a literal string that doesn't appear in the code (AST requires valid syntax)

CRITICAL: Refer to the 'ast-grep' skill for full query syntax rules, meta-variable rules, and usage examples.

Parameters:
- query: (required) Inline YAML rule definition with id, language, and rule.pattern fields
- path: (optional) Limit search to a specific directory. Leave empty for entire workspace.
- file_pattern: (optional) Glob pattern to filter files (e.g., "*.{ts,tsx}")`

const QUERY_PARAMETER_DESCRIPTION = `Inline YAML rule definition (required fields: id, language, rule.pattern). See ast-grep skill for syntax.`

const PATH_PARAMETER_DESCRIPTION = `Optional directory (relative to workspace) to limit the search scope`

const FILE_PATTERN_PARAMETER_DESCRIPTION = `Optional glob pattern to filter files (e.g., "*.{ts,tsx}")`

export default {
  type: "function",
  function: {
    name: "ast_grep",
    description: AST_GREP_DESCRIPTION,
    strict: true,
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: QUERY_PARAMETER_DESCRIPTION,
        },
        path: {
          type: ["string", "null"],
          description: PATH_PARAMETER_DESCRIPTION,
        },
        file_pattern: {
          type: ["string", "null"],
          description: FILE_PATTERN_PARAMETER_DESCRIPTION,
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
} satisfies OpenAI.Chat.ChatCompletionTool
