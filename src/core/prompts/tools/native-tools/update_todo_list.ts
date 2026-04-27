import type OpenAI from "openai"

const UPDATE_TODO_LIST_DESCRIPTION = `This tool is designed for step-by-step task tracking via TODO list.

IMPORTANT: Replace the entire TODO list with an updated list reflecting the current state. Always provide the full updated list, because the system will overwrite the previous one.

Checklist Format:
- Use a single-level markdown checklist (no nesting or subtasks)
- List todo entries in the intended execution order
- Status options: [ ] (pending), [x] (completed), [-] (in progress)

Core Principles:
- Before updating the list, always confirm which todo entries have been completed
- You may update multiple todo entries statuses in a single update (e.g., mark one as completed and start the next)
- Dynamically add new todo entries as they're discovered
- Only mark a todo entry as completed when fully accomplished
- Keep all unfinished todo entries unless explicitly instructed to remove them

Example: Initial task list
{ "todos": "[x] Analyze requirements\\n[x] Design architecture\\n[-] Implement core logic\\n[ ] Write tests\\n[ ] Update documentation" }

Example: After completing implementation
{ "todos": "[x] Analyze requirements\\n[x] Design architecture\\n[x] Implement core logic\\n[-] Write tests\\n[ ] Update documentation\\n[ ] Add performance benchmarks" }

When to Use:
- Task involves multiple steps or requires step-by-step progress tracking
- Need to update status of several todos at once
- New actionable items are discovered during execution

When NOT to Use:
- Only a single, trivial task
- Task can be completed in one or two simple steps
- Request is purely conversational or informational`

const TODOS_PARAMETER_DESCRIPTION = `Full markdown checklist in execution order, using [ ] for pending, [x] for completed, and [-] for in progress`

export default {
	type: "function",
	function: {
		name: "update_todo_list",
		description: UPDATE_TODO_LIST_DESCRIPTION,
		strict: true,
		parameters: {
			type: "object",
			properties: {
				todos: {
					type: "string",
					description: TODOS_PARAMETER_DESCRIPTION,
				},
			},
			required: ["todos"],
			additionalProperties: false,
		},
	},
} satisfies OpenAI.Chat.ChatCompletionTool
