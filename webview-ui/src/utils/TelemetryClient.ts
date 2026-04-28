import type { TelemetrySetting } from "@roo-code/types"

class TelemetryClient {
	private static instance: TelemetryClient

	public updateTelemetryState(_telemetrySetting: TelemetrySetting, _apiKey?: string, _distinctId?: string) {}

	public static getInstance(): TelemetryClient {
		if (!TelemetryClient.instance) {
			TelemetryClient.instance = new TelemetryClient()
		}

		return TelemetryClient.instance
	}

	public capture(_eventName: string, _properties?: Record<string, any>) {}
}

export const telemetryClient = TelemetryClient.getInstance()
