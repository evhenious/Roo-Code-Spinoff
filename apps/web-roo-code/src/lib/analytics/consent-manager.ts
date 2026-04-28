/**
 * Simple consent event system
 * Dispatches events when cookie consent changes
 */

/**
 * Check if user has given consent for analytics cookies
 * Uses react-cookie-consent's built-in function
 */
export function hasConsent(): boolean {
	return false
}

/**
 * Dispatch a consent change event
 */
export function dispatchConsentEvent(_consented: boolean): void {}

/**
 * Listen for consent changes
 */
export function onConsentChange(_callback: (consented: boolean) => void): () => void {
	return () => {}
}

/**
 * Handle user accepting cookies
 * Opts PostHog back into cookie-based tracking
 */
export function handleConsentAccept(): void {}

/**
 * Handle user rejecting cookies
 * Switches PostHog to cookieless (memory-only) mode
 */
export function handleConsentReject(): void {}
