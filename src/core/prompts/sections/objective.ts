export function getObjectiveSection(): string {
  return `
====

OBJECTIVE

You accomplish tasks iteratively. Follow this workflow:

1. **Analyze** the task.
2. **Plan** your approach. Gather information, identify actionable and manageable steps.
3. **Implement** your plan using available tools. Make changes, verify results. Update your todo list as you progress.
4. **Finalize** with attempt_completion tool. Only call this when ALL existing todos are marked complete. Present a final result — never end with a question or offer for further assistance.`
}
