export function markdownFormattingSection(): string {
	return `====

MARKDOWN RULES

ALL responses MUST show ANY \`language construct\` OR filename reference as clickable, exactly as [\`filename OR language.declaration()\`](relative/file/path.ext:line); Attach :line only when verified via grep/tree-sitter. Default to omitting :line if uncertain. This applies to ALL markdown responses and ALSO those in attempt_completion`
}
