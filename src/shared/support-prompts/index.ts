import { enhanceTemplate } from "./enhance"
import { condenseTemplate } from "./condense"
import { explainTemplate } from "./explain"
import { fixTemplate } from "./fix"
import { improveTemplate } from "./improve"
import { addToContextTemplate } from "./add-to-context"
import { terminalAddToContextTemplate } from "./terminal-add-to-context"
import { terminalFixTemplate } from "./terminal-fix"
import { terminalExplainTemplate } from "./terminal-explain"
import { newTaskTemplate } from "./new-task"

export type { SupportPromptType } from "../support-prompt"
export type { CustomSupportPrompts } from "../support-prompt"

export {
	enhanceTemplate,
	condenseTemplate,
	explainTemplate,
	fixTemplate,
	improveTemplate,
	addToContextTemplate,
	terminalAddToContextTemplate,
	terminalFixTemplate,
	terminalExplainTemplate,
	newTaskTemplate,
}

export const supportPromptConfigs = {
	ENHANCE: {
		template: enhanceTemplate,
	},
	CONDENSE: {
		template: condenseTemplate,
	},
	EXPLAIN: {
		template: explainTemplate,
	},
	FIX: {
		template: fixTemplate,
	},
	IMPROVE: {
		template: improveTemplate,
	},
	ADD_TO_CONTEXT: {
		template: addToContextTemplate,
	},
	TERMINAL_ADD_TO_CONTEXT: {
		template: terminalAddToContextTemplate,
	},
	TERMINAL_FIX: {
		template: terminalFixTemplate,
	},
	TERMINAL_EXPLAIN: {
		template: terminalExplainTemplate,
	},
	NEW_TASK: {
		template: newTaskTemplate,
	},
} as const
