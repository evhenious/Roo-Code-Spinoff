/**
 * saveImage Handler
 *
 * Handles the "saveImage" message type - saves an image.
 */

import * as os from "os"
import * as path from "path"
import * as vscode from "vscode"
import type { HandlerContext, MessageHandler } from "../../types/handlerTypes"
import { validateMessage } from "../../utils/messageValidators"
import { saveImage } from "../../../../integrations/misc/image-handler"
import { resolveDefaultSaveUri, saveLastExportPath } from "../../../../utils/export"

const rawHandler: MessageHandler = async (ctx, message) => {
  const validated = validateMessage("saveImage", message)
  const { dataUri } = validated

  if (dataUri) {
    const matches = dataUri.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/)
    if (!matches) {
      // Let saveImage handle invalid URI error
      saveImage(dataUri, vscode.Uri.file(""))
      return
    }
    const format = matches[1]
    const defaultFileName = `img_${Date.now()}.${format}`

    const defaultUri = await resolveDefaultSaveUri(ctx.provider.contextProxy, "lastImageSavePath", defaultFileName, {
      useWorkspace: false,
      fallbackDir: path.join(os.homedir(), "Downloads"),
    })

    const savedUri = await saveImage(dataUri, defaultUri)

    if (savedUri) {
      await saveLastExportPath(ctx.provider.contextProxy, "lastImageSavePath", savedUri)
    }
  }
}

export const saveImageHandler: MessageHandler = async (ctx, message) => {
  try {
    await rawHandler(ctx, message)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    ctx.log(`Error saving image: ${errorMessage}`)
  }
}
