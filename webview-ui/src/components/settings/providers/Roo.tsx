import { type ProviderSettings, type RouterModels, rooDefaultModelId } from "@roo-code/types"

import { ModelPicker } from "../ModelPicker"

type RooProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
	routerModels?: RouterModels
	modelValidationError?: string
	simplifySettings?: boolean
}

export const Roo = ({
	apiConfiguration,
	setApiConfigurationField,
	routerModels,
	modelValidationError,
	simplifySettings,
}: RooProps) => {
	return (
		<ModelPicker
			apiConfiguration={apiConfiguration}
			setApiConfigurationField={setApiConfigurationField}
			defaultModelId={rooDefaultModelId}
			models={routerModels?.roo ?? {}}
			modelIdKey="apiModelId"
			serviceName="Roo Code Router"
			serviceUrl="https://app.roocode.com"
			errorMessage={modelValidationError}
			simplifySettings={simplifySettings}
		/>
	)
}
