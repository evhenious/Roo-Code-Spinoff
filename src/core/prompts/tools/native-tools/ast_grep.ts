import type OpenAI from "openai"

const AST_GREP_DESCRIPTION = `Search code using AST (Abstract Syntax Tree) patterns via ast-grep (sg).
This tool finds code based on structural patterns rather than plain text matching.
It's ideal for finding specific code constructs like function definitions, class usages, method calls, etc.

CRITICAL:
- Use this tool when you need to find code based on its structure/syntax rather than just text content.
- The query should be an ast-grep pattern (SgPattern).
- ast-grep must be installed and available in the PATH for this tool to work.
- If ast-grep is not installed or fails, fall back to using codebase_search or search_files instead.
  
Parameters:
- query: (required) The ast-grep pattern to search for. Use simple text matches or import patterns. CRITICAL: meta variables should be in capitals: $NAME, $X, $VAR etc. Examples:
  - "useEffect" - finds all occurrences of useEffect (text match)
  - "useState" - finds all occurrences of useState (text match)
  - 'import $X from "react"' - finds all React imports with any variable name
  - 'import $NAME from "$Module"' - finds all imports from any module
- path: (optional) Limit search to a specific directory. Leave empty for entire workspace.
- file_pattern: (optional) Glob pattern to filter files. MUST use proper glob syntax with brace expansion for multiple extensions, e.g., "*.{js,jsx,ts,tsx}" NOT "*.js,jsx,ts,tsx". Single patterns like "*.ts" or directory globs like "src/**/*.js" are also valid.

Example: Searching for all React hooks usage
{ "query": "useEffect", "file_pattern": "*.{ts,tsx}" }

Example: Finding all React imports
{ "query": "import $X from \"react\"" }

Example: Searching for imports from a specific module in a directory
{ "query": "import $NAME from \"lodash\"", "path": "src/utils" }`

const QUERY_PARAMETER_DESCRIPTION = `The ast-grep pattern to search for (SgPattern syntax)`

const PATH_PARAMETER_DESCRIPTION = `Optional directory (relative to workspace) to limit the search scope`

const FILE_PATTERN_PARAMETER_DESCRIPTION = `Optional glob pattern to filter files. MUST use proper glob syntax with brace expansion for multiple extensions, e.g., "*.{js,jsx,ts,tsx}" NOT "*.js,jsx,ts,tsx"`

// const LANG_PARAMETER_DESCRIPTION = `Optional language filter (e.g., "typescript", "javascript", "python", "rust")`

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
				// 0.42 doez not work for some reason
				// lang: {
				// 	type: ["string", "null"],
				// 	description: LANG_PARAMETER_DESCRIPTION,
				// },
			},
			required: ["query"],
			additionalProperties: false,
		},
	},
} satisfies OpenAI.Chat.ChatCompletionTool
