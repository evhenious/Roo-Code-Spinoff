import { VSCodeTextArea } from "@vscode/webview-ui-toolkit/react"
import { useState } from "react"

import { supportPrompt, SupportPromptType } from "@roo/support-prompt"

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  StandardTooltip,
} from "@src/components/ui"
import { useAppTranslation } from "@src/i18n/TranslationContext"

import { SearchableSetting } from "./SearchableSetting"
import { Section } from "./Section"
import { SectionHeader } from "./SectionHeader"

interface PromptsSettingsProps {
  customSupportPrompts: Record<string, string | undefined>
  setCustomSupportPrompts: (prompts: Record<string, string | undefined>) => void
}

const PromptsSettings = ({ customSupportPrompts, setCustomSupportPrompts }: PromptsSettingsProps) => {
  const { t } = useAppTranslation()

  const [activeSupportOption, setActiveSupportOption] = useState<SupportPromptType>("CONDENSE")

  const updateSupportPrompt = (type: SupportPromptType, value: string | undefined) => {
    // Don't trim during editing to preserve intentional whitespace
    // Use nullish coalescing to preserve empty strings
    const finalValue = value ?? undefined

    const updatedPrompts = { ...customSupportPrompts }
    if (finalValue === undefined) {
      delete updatedPrompts[type]
    } else {
      updatedPrompts[type] = finalValue
    }
    setCustomSupportPrompts(updatedPrompts)
  }

  const handleSupportReset = (type: SupportPromptType) => {
    const updatedPrompts = { ...customSupportPrompts }
    delete updatedPrompts[type]
    setCustomSupportPrompts(updatedPrompts)
  }

  const getSupportPromptValue = (type: SupportPromptType): string => {
    return supportPrompt.get(customSupportPrompts, type)
  }

  return (
    <div>
      <SectionHeader description={t("settings:prompts.description")}>{t("settings:sections.prompts")}</SectionHeader>

      <Section>
        <SearchableSetting
          settingId="prompts-support-prompt-select"
          section="prompts"
          label={t("settings:sections.prompts")}>
          <Select
            value={activeSupportOption}
            onValueChange={(type) => setActiveSupportOption(type as SupportPromptType)}>
            <SelectTrigger className="w-full" data-testid="support-prompt-select-trigger">
              <SelectValue placeholder={t("settings:common.select")} />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(supportPrompt.default).map((type) => (
                <SelectItem key={type} value={type} data-testid={`${type}-option`}>
                  {t(`prompts:supportPrompts.types.${type}.label`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-vscode-descriptionForeground mt-1">
            {t(`prompts:supportPrompts.types.${activeSupportOption}.description`)}
          </div>
        </SearchableSetting>

        <div key={activeSupportOption} className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <label className="block font-medium">{t("prompts:supportPrompts.prompt")}</label>
            <StandardTooltip
              content={t("prompts:supportPrompts.resetPrompt", {
                promptType: activeSupportOption,
              })}>
              <Button variant="ghost" size="icon" onClick={() => handleSupportReset(activeSupportOption)}>
                <span className="codicon codicon-discard"></span>
              </Button>
            </StandardTooltip>
          </div>

          <VSCodeTextArea
            resize="vertical"
            value={getSupportPromptValue(activeSupportOption)}
            onInput={(e) => {
              const value =
                (e as unknown as CustomEvent)?.detail?.target?.value ?? ((e as any).target as HTMLTextAreaElement).value
              updateSupportPrompt(activeSupportOption, value)
            }}
            rows={6}
            className="w-full"
          />
        </div>
      </Section>
    </div>
  )
}

export default PromptsSettings
