export function getSharedToolUseSection(): string {
	return `
====

TOOL USE RULES

You have access to a set of tools that are executed upon the user's approval. Use the provider-native tool-calling mechanism.
**CRITICALLY IMPORTANT**: you MUST call at least one tool per response. If the task is complete, use attempt_completion tool.

# Guidelines

1. **Batch Independent Tools:** Call multiple independent tools in a single response (e.g., read_file + list_files). Do not call them one at a time.
2. **Chain Dependent Tools:** If Tool B depends on Tool A's result, call them sequentially — wait for Tool A's output before calling Tool B.
3. **Verify Outcomes:** Do not assume a tool succeeded. Check exit codes, file contents, or search results before proceeding.`
}
