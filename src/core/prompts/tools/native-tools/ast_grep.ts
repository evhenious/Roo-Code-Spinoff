import type OpenAI from "openai"

const AST_GREP_DESCRIPTION = `Search code using AST (Abstract Syntax Tree) patterns via ast-grep (sg).
This tool finds code based on structural patterns rather than plain text matching.
Ideal for finding specific code constructs like function definitions, class usages, method calls, etc.

CRITICAL:
- refer to 'ast-grep' skill for usage examples and query syntax rules

Parameters:
- query: (required) The inline YAML rule definition as a multi-line string. Must include at minimum:
  - id: a unique identifier for the search
  - language: language for which rule.pattern is a valid code fragment (e.g. tsx, javascript, typescript, rust)
  - rule.pattern: the AST pattern to match (use $$$ for meta-variables, $NAME for named variables)
    Example for simple text match:
      'id: find-useeffect\\nlanguage: jsx\\nrule:\\n  pattern: "useEffect"'
    Example with constraints:
    'id: find-all-react-hooks\\nlanguage: tsx\\nrule:\\n  pattern: "const $$$ = $HOOK<$TYPE>($$$ARGS)"\\nconstraints:\\n  HOOK:\\n    regex: "^use[A-Z]"'
- path: (optional) Limit search to a specific directory. Leave empty for entire workspace.
- file_pattern: (optional) Glob pattern to filter files. MUST use proper glob syntax with brace expansion for multiple extensions, e.g., "*.{js,jsx,ts,tsx}". Single patterns like "*.ts" or directory globs like "src/**/*.js" are also valid.`

const QUERY_PARAMETER_DESCRIPTION = `The inline YAML rule definition (required: id, language and rule.pattern). Use \\n for newlines.`

const PATH_PARAMETER_DESCRIPTION = `Optional directory (relative to workspace) to limit the search scope`

const FILE_PATTERN_PARAMETER_DESCRIPTION = `Optional glob pattern to filter files. MUST use proper glob syntax with brace expansion for multiple extensions, e.g., "*.{ts,tsx}"`

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
