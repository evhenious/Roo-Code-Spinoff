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

  const skillsDescr = skills
    .map((skill) => {
      const name = escapeXml(skill.name)
      const description = escapeXml(skill.description)
      const locationLine = escapeXml(skill.path)
      return `### ${name}\n - Description: ${description}\n - Location: ${locationLine}\n`
    })
    .join("\n")

  return `====

AVAILABLE SKILLS

The skill list is already filtered for the current mode: "${currentMode}". Mode-specific skills may come from skills-${currentMode}/ with project-level overrides taking precedence over global skills.

${skillsDescr}
# MANDATORY SKILL CHECK

Before producing ANY user-facing response, perform a skill applicability check.

1. Evaluate the user's request against ALL skill Descriptions. Determine whether at least one skill clearly applies.
2. If any skills apply - select EXACTLY ONE skill (prefer the most specific). Load it via the skill tool, read its instructions fully, then follow them precisely. Do NOT respond outside the skill-defined flow.
3. If no skills could apply - do NOT load any SKILL.md files. Proceed normally with available data.

CONSTRAINTS: 
- Do NOT load every skill up front. Load skills ONLY after selection. Do NOT reload a skill already loaded. Do NOT skip this check. FAILURE to perform this check is an error.
- When a skill is loaded, ONLY its instructions are present. Linked files are NOT loaded automatically.
- Explicitly decide to read linked files based on task relevance. Prefer minimum necessary files.
- Treat linked files as progressive disclosure, not mandatory context.`
}
