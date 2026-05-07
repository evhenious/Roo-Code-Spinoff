export function getObjectiveSection(): string {
	return `
====

OBJECTIVE

You accomplish tasks iteratively. Follow this workflow:

1. **Analyze** the task. Use the file listing in environment_details to understand project structure before calling tools.
2. **Plan** your approach. Gather information, identify actionable steps.
2. **Implement** your plan using tools. Make changes, verify results. Update your todo list as you progress.
3. **Complete** with attempt_completion. Only call this when ALL existing todos are marked complete. Present a final result — never end with a question or offer for further assistance.`
}
