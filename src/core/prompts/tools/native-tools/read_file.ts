import type OpenAI from "openai"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default maximum lines to return per file (Codex-inspired predictable limit) */
export const DEFAULT_LINE_LIMIT = 2000

/** Maximum characters per line before truncation */
export const MAX_LINE_LENGTH = 2000

/** Default indentation levels to include above anchor (0 = unlimited) */
export const DEFAULT_MAX_LEVELS = 0

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Generates the file support note, optionally including image format support.
 *
 * @param supportsImages - Whether the model supports image processing
 * @returns Support note string
 */
function getReadFileSupportsNote(supportsImages: boolean): string {
  if (supportsImages) {
    return `File support: supports text extraction from PDF and DOCX files. Automatically processes and returns image files (PNG, JPG, GIF, SVG, etc.) for visual analysis. May not handle other binary files properly.`
  }
  return `File support: supports text extraction from PDF and DOCX files. May not handle other binary files properly.`
}

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Options for creating the read_file tool definition.
 */
export interface ReadFileToolOptions {
  /** Whether the model supports image processing (default: false) */
  supportsImages?: boolean
}

// ─── Schema Builder ───────────────────────────────────────────────────────────

/**
 * Creates the read_file tool definition with Codex-inspired modes.
 *
 * Two reading modes are supported:
 *
 * 1. **Slice Mode** (default): Simple offset/limit reading
 *    - Reads contiguous lines starting from `offset` (1-based, default: 1)
 *    - Limited to `limit` lines (default: 2000)
 *    - Predictable and efficient for agent planning
 *
 * 2. **Indentation Mode**: Semantic code block extraction
 *    - Anchored on a specific line number (1-based)
 *    - Extracts the block containing that line plus context
 *    - Respects code structure based on indentation hierarchy
 *    - Useful for extracting functions, classes, or logical blocks
 *
 * @param options - Configuration options for the tool
 * @returns Native tool definition for read_file
 */
export function createReadFileTool(options: ReadFileToolOptions = {}): OpenAI.Chat.ChatCompletionTool {
  const { supportsImages = false } = options

  // Build description based on capabilities
  const descriptionIntro = `Read a file and return its contents with line numbers for diffing or discussion. 

IMPORTANT: Read exactly one file per call. For multiple files, issue parallel read_file calls.`

  const modeDescription = `Modes:
1. slice (default) — Read contiguous lines by offset/limit. Use for general exploration, config files, or when you don't know a specific line number. May truncate mid-function.
2. indentation — Extract a complete semantic code block (function, class, method) around a given line number. Use when you have a line number from search results, error traces, or code references. Guarantees syntactically valid blocks.
`

  const limitNote = `Limits: Returns up to ${DEFAULT_LINE_LIMIT} lines per file. Lines longer than ${MAX_LINE_LENGTH} characters are truncated.`

  const description =
    descriptionIntro +
    modeDescription +
    limitNote +
    "\n" +
    getReadFileSupportsNote(supportsImages) +
    "\n" +
    `Examples: 
1. slice mode: { path: 'src/app.ts' }
2. slice with range: { path: 'src/app.ts', mode: 'slice', offset: 50, limit: 20 }
3. indentation mode: { path: 'src/app.ts', mode: 'indentation', indentation: { anchor_line: 42 } }`

  const indentationProperties: Record<string, unknown> = {
    anchor_line: {
      type: "integer",
      description:
        "1-based line number to anchor extraction. REQUIRED for indentation mode. The extractor returns the full code block containing this line.",
    },
    max_levels: {
      type: "integer",
      description: `Maximum indentation levels to include above the anchor (indentation mode, 0 = unlimited (default)). Higher values include more parent context.`,
    },
    include_siblings: {
      type: "boolean",
      description:
        "Include sibling blocks at the same indentation level as the anchor block (indentation mode, default: false). Useful for seeing related methods in a class.",
    },
    include_header: {
      type: "boolean",
      description:
        "Include file header content (imports, module-level comments) at the top of output (indentation mode, default: true).",
    },
    max_lines: {
      type: "integer",
      description:
        "Hard cap on lines returned for indentation mode. Acts as a separate limit from the top-level 'limit' parameter.",
    },
  }

  const properties: Record<string, unknown> = {
    path: {
      type: "string",
      description: "Path to the file to read, relative to the workspace",
    },
    mode: {
      type: "string",
      enum: ["slice", "indentation"],
      description:
        "Reading mode: 'slice' (default, line range) or 'indentation' (semantic code block around a line number). See tool description for mode selection guidance.",
    },
    offset: {
      type: "integer",
      description: "1-based starting line number (slice mode only, default: 1)",
    },
    limit: {
      type: "integer",
      description: `Maximum lines to return (slice mode, default: ${DEFAULT_LINE_LIMIT})`,
    },
    indentation: {
      type: "object",
      description: "Indentation mode options. Only used when mode='indentation'.",
      properties: indentationProperties,
      required: [],
      additionalProperties: false,
    },
  }

  return {
    type: "function",
    function: {
      name: "read_file",
      description,
      strict: true,
      parameters: {
        type: "object",
        properties,
        required: ["path"],
        additionalProperties: false,
      },
    },
  } satisfies OpenAI.Chat.ChatCompletionTool
}

/**
 * Default read_file tool with all parameters
 */
export const read_file = createReadFileTool()
