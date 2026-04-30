import React, { useEffect } from "react"

import { useExtensionStateStore, mergeExtensionState } from "@src/store/useExtensionStateStore"

// Re-export mergeExtensionState for backward compatibility with tests
export { mergeExtensionState }

export const ExtensionStateContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const handleMessage = useExtensionStateStore((state) => state.handleMessage)
	const initialize = useExtensionStateStore((state) => state.initialize)
	const requestRooModels = useExtensionStateStore((state) => state.requestRooModels)
	const cloudIsAuthenticated = useExtensionStateStore((state) => state.cloudIsAuthenticated)
	const apiConfiguration = useExtensionStateStore((state) => state.apiConfiguration)
	const prevCloudIsAuthenticated = useExtensionStateStore((state) => state.prevCloudIsAuthenticated)

	// Set up message listener on mount
	useEffect(() => {
		const handler = (event: MessageEvent) => {
			handleMessage(event)
		}

		window.addEventListener("message", handler)
		return () => {
			window.removeEventListener("message", handler)
		}
	}, [handleMessage])

	// Initialize webview on mount
	useEffect(() => {
		initialize()
	}, [initialize])

	// Watch for authentication state changes and refresh Roo models
	useEffect(() => {
		const currentAuth = cloudIsAuthenticated ?? false
		const currentProvider = apiConfiguration?.apiProvider
		if (!prevCloudIsAuthenticated && currentAuth && currentProvider === "roo") {
			requestRooModels()
		}
		useExtensionStateStore.setState({ prevCloudIsAuthenticated: currentAuth })
	}, [cloudIsAuthenticated, prevCloudIsAuthenticated, apiConfiguration?.apiProvider, requestRooModels])

	return <>{children}</>
}

export const useExtensionState = () => {
	return useExtensionStateStore()
}
