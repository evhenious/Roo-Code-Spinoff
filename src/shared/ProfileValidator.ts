import type { ProviderSettings } from "@roo-code/types"

export class ProfileValidator {
	public static isProfileAllowed(profile: ProviderSettings): boolean {
		return true
	}
}
