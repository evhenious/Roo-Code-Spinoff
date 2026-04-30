import { type Language, isLanguage } from "@roo-code/types"

/**
 * Language name mapping from ISO codes to full language names.
 */

export const LANGUAGES: Record<Language, string> = {
	en: "English",
}

/**
 * Formats a VSCode locale string and returns the language code.
 * Since only English is supported, this always returns "en".
 *
 * @param _vscodeLocale - The VSCode locale string (ignored, always returns "en")
 * @returns "en" (the only supported language)
 */

export function formatLanguage(_vscodeLocale: string): Language {
	return "en"
}
