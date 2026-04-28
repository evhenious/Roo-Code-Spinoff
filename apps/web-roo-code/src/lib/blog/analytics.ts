/**
 * Blog-specific PostHog analytics events
 * MKT-74: Blog Analytics (PostHog)
 */

import type { BlogPost } from "./types"

/**
 * Track blog index page view
 */
export function trackBlogIndexView(): void {}

/**
 * Track individual blog post view
 */
export function trackBlogPostView(_post: BlogPost): void {}

/**
 * Track Substack subscribe click
 */
export function trackSubstackClick(): void {}
