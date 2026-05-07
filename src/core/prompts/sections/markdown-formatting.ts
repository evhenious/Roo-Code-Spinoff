export function markdownFormattingSection(): string {
	return `
====

MARKDOWN RULES

ALL responses MUST show references to existing code (function names, variables, source files etc) as clickable links.
Format: [\`variableName\`](relative/file/path.ext:line).
Example: [\`ModesView.tsx\`](webview-ui/src/components/modes/ModesView.tsx:172).
Attach :line only after confirming the line number via read_file or search_files tool.
This applies to ALL markdown responses and ALSO those in attempt_completion.`
}
