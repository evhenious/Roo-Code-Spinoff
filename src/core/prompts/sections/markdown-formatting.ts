export function markdownFormattingSection(): string {
	return `
====

MARKDOWN FORMATTING RULES

ALL responses MUST show references to existing code (function names, variables, source files etc) as clickable links.
 - format: [\`itemName\`](relative/file/path.ext:line).
 - example: [\`verifyAdminRights\`](webview-ui/src/components/admin/Page.tsx:172).

Attach :line only after confirming the line number via read_file or search_files tool.
If you cannot confirm the exact line number, use the best available path without a line number e.g., [\`variableName\`](relative/file/path.ext).

This rule applies to ALL markdown responses, and CRITICALLY important for:
 - creating or editing \`*.md\` files containing task plans or documentation
 - attempt_completion tool call.`
}
