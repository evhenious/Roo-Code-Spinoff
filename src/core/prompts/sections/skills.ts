import type { SkillsManager } from "../../../services/skills/SkillsManager"

type SkillsManagerLike = Pick<SkillsManager, "getSkillsForMode">

function escapeXml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/\"/g, "&quot;")
		.replace(/'/g, "&apos;")
}

/**
 * Generate the skills section for the system prompt.
 * Only includes skills relevant to the current mode.
 * Format matches the modes section style.
 *
 * @param skillsManager - The SkillsManager instance
 * @param currentMode - The current mode slug (e.g., 'code', 'architect')
 */
export async function getSkillsSection(
	skillsManager: SkillsManagerLike | undefined,
	currentMode: string | undefined,
): Promise<string> {
	if (!skillsManager || !currentMode) return ""

	// Get skills filtered by current mode (with override resolution)
	const skills = skillsManager.getSkillsForMode(currentMode)
	if (skills.length === 0) return ""

	const skillsXml = skills
		.map((skill) => {
			const name = escapeXml(skill.name)
			const description = escapeXml(skill.description)
			const locationLine = `\n    <location>${escapeXml(skill.path)}</location>`
			return `  <skill>\n    <name>${name}</name>\n    <description>${description}</description>${locationLine}\n  </skill>`
		})
		.join("\n")

	return `====

AVAILABLE SKILLS

<available_skills>
${skillsXml}
</available_skills>

<mandatory_skill_check>
REQUIRED PRECONDITION — Before producing ANY user-facing response, perform a skill applicability check.

Step 1: Evaluate the user's request against ALL skill <description> entries. Determine whether at least one skill clearly applies.

Step 2: Branching Decision
- <if_skill_applies> Select EXACTLY ONE skill (prefer the most specific). Load it via the skill tool, read its instructions fully, then follow them precisely. Do NOT respond outside the skill-defined flow.
- <if_no_skill_applies> Do NOT load any SKILL.md files. Proceed normally with available data.

CONSTRAINTS: Do NOT load every skill up front. Load skills ONLY after selection. Do NOT reload a skill already loaded. Do NOT skip this check. FAILURE to perform this check is an error.
</mandatory_skill_check>

<linked_file_handling>
- When a skill is loaded, ONLY its instructions are present. Linked files are NOT loaded automatically.
- Explicitly decide to read linked files based on task relevance. Prefer minimum necessary files.
- Treat linked files as progressive disclosure, not mandatory context.
</linked_file_handling>

<context_notes>
- The skill list is already filtered for the current mode: "${currentMode}".
- Mode-specific skills may come from skills-${currentMode}/ with project-level overrides taking precedence over global skills.
</context_notes>`
}
