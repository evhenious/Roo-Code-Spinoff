// npx vitest run src/shared/__tests__/language.spec.ts

import { formatLanguage } from "../language"

describe("formatLanguage", () => {
	it("should always return 'en' since only English is supported", () => {
		expect(formatLanguage("pt-br")).toBe("en")
		expect(formatLanguage("zh-cn")).toBe("en")
		expect(formatLanguage("fr")).toBe("en")
		expect(formatLanguage("en")).toBe("en")
	})

	it("should handle empty or undefined input", () => {
		expect(formatLanguage("")).toBe("en")
		expect(formatLanguage(undefined as unknown as string)).toBe("en")
	})

	it("should ignore the input parameter", () => {
		expect(formatLanguage("de")).toBe("en")
		expect(formatLanguage("pl")).toBe("en")
		expect(formatLanguage("ja")).toBe("en")
	})
})
