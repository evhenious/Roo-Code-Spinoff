import { type TelemetryEvent } from "@roo-code/types"

import { BaseTelemetryClient } from "./BaseTelemetryClient"

/**
 * PostHogTelemetryClient handles telemetry event tracking for the Roo Code extension.
 * Uses PostHog analytics to track user interactions and system events.
 * Respects user privacy settings and VSCode's global telemetry configuration.
 */
export class PostHogTelemetryClient extends BaseTelemetryClient {
	constructor() {
		super()
	}

	/**
	 * Filter out git repository properties for PostHog telemetry
	 * @param propertyName The property name to check
	 * @returns Whether the property should be included in telemetry events
	 */
	protected override isPropertyCapturable(_propertyName: string): boolean {
		return false
	}

	public override async capture(_event: TelemetryEvent): Promise<void> {}

	public override async captureException(
		_error: Error,
		_additionalProperties?: Record<string, unknown>,
	): Promise<void> {}

	/**
	 * Updates the telemetry state based on user preferences and VSCode settings.
	 * Only enables telemetry if both VSCode global telemetry is enabled and
	 * user has opted in.
	 * @param didUserOptIn Whether the user has explicitly opted into telemetry
	 */
	public override updateTelemetryState(_didUserOptIn: boolean): void {}

	public override async shutdown(): Promise<void> {}
}
