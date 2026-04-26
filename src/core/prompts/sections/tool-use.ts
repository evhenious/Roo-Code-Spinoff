export function getSharedToolUseSection(): string {
	return `====

TOOL USE

You have access to a set of tools that are executed upon the user's approval. Use the provider-native tool-calling mechanism. Do not include XML markup or examples. You must call at least one tool per assistant response. Exception: If the task is complete or purely informational, you may use attempt_completion or ask_followup_question instead of a file/command tool.

# Tool Use Guidelines

1. Assess what information you already have and what information you need to proceed with the task.
2. Choose the most appropriate tool based on the task and the tool descriptions provided. Assess if you need additional information to proceed, and which of the available tools would be most effective for gathering this information. For example using the list_files tool is more effective than running a command like \`ls\` in the terminal. It's critical that you think about each available tool and use the one that best fits the current step in the task.
3. **Batch Independent Tools:** You may call multiple tools in a single response IF they are independent (e.g., reading \`fileA.txt\` and \`fileB.txt\` simultaneously).
4. **Wait for Dependent Results:** If Tool B depends on the result of Tool A (e.g., \`read_file\` then \`edit_file\`), you MUST call Tool A, wait for the user's response/result, and then call Tool B. Do not assume outcomes.
5. **No Silent Assumptions:** Do not assume the outcome of any tool use. Each step must be informed by the previous step's result.

By carefully considering the user's response after tool executions, you can react accordingly and make informed decisions about how to proceed with the task. This iterative process helps ensure the overall success and accuracy of your work.

`
}
