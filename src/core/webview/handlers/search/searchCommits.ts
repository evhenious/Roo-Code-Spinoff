/**
 * searchCommits Handler
 *
 * Handles the "searchCommits" message type - searches git commits.
 */

import * as vscode from "vscode"
import { t } from "../../../../i18n"
import { searchCommits } from "../../../../utils/git"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { getCurrentCwd } from "../../utils/commonHelpers"

/**
 * Handler for searchCommits messages.
 * Searches git commits in the current workspace.
 */
export const searchCommitsHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("searchCommits", message)
  const cwd = getCurrentCwd(ctx.provider)
  if (cwd) {
    try {
      const commits = await searchCommits(validated.query || "", cwd)
      await ctx.provider.postMessageToWebview({
        type: "commitSearchResults",
        commits,
      })
    } catch (error) {
      ctx.provider.log(`Error searching commits: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`)
      vscode.window.showErrorMessage(t("common:errors.search_commits"))
    }
  }
}
