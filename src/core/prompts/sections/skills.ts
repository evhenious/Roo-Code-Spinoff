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

"Skills" are high-level procedural workflows and specific domain guidelines. Do not rely solely on available tools and native capabilities if a specialized skill exists for the task.

For every user's request which is not trivial or purely conversational, or requires specific domain knowledge, you MUST:
1. Evaluate the request against ALL skill Descriptions provided in the list below. Determine whether at least one skill clearly applies.
2. If any skills apply:
  - Select EXACTLY ONE skill (prefer the most specific match)
  - Load selected skill using the \`skill\` tool BEFORE executing any other tools, read its instructions fully, and follow them precisely. Do NOT take actions outside the skill-defined flow.
3. If no skills could apply - proceed with other available tools.

The skills list:

${skillsDescr}
CONSTRAINTS: 
- Do NOT load every skill up front. Load skills ONLY after selection. 
- Do NOT reload a skill already loaded. Do NOT skip this check. FAILURE to perform this check is an error.
- When a skill is loaded, follow its instructions while respecting all system-level constraints and mode rules.
- Treat linked files as progressive disclosure, not mandatory context.
- Explicitly decide to read linked files based on task relevance. Prefer minimum necessary files.`
}
