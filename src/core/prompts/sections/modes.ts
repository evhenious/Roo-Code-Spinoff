import * as vscode from "vscode"

import type { ModeConfig } from "@roo-code/types"

import { getAllModesWithPrompts } from "../../../shared/modes"
import { ensureSettingsDirectoryExists } from "../../../utils/globalContext"

export async function getModesSection(context: vscode.ExtensionContext, currentMode?: string): Promise<string> {
	// Make sure path gets created
	await ensureSettingsDirectoryExists(context)

	// Get all modes with their overrides from extension state
	const allModes = await getAllModesWithPrompts(context)

	const modesList = allModes
		.filter((mode: ModeConfig) => !mode.hidden)
		.map((mode: ModeConfig) => {
			let description: string
			if (mode.whenToUse && mode.whenToUse.trim() !== "") {
				// Use whenToUse as the primary description, indenting subsequent lines for readability
				description = mode.whenToUse.replace(/\n/g, "\n    ")
			} else {
				// Fallback to the first sentence of roleDefinition if whenToUse is not available
				description = mode.roleDefinition.split(".")[0]
			}
			const isCurrentMode = mode.slug === currentMode
			const prefix = isCurrentMode ? "**CURRENT MODE** " : "  "
			return `  * ${prefix}"${mode.name}" mode (${mode.slug}) - ${description}`
		})
		.join("\n")

	const modesContent = `
====

AVAILABLE MODES

${modesList}

- **Current mode:** ${currentMode ? `"${currentMode}"` : "Not set"} — You are operating in this mode right now.`

	return modesContent
}
