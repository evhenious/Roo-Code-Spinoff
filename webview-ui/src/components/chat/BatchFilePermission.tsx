import { memo } from "react"

import { formatPathTooltip } from "@src/utils/formatPathTooltip"
import { vscode } from "@src/utils/vscode"
import { ToolUseBlock, ToolUseBlockHeader } from "../common/ToolUseBlock"
import { PathTooltip } from "../ui/PathTooltip"

interface FilePermissionItem {
  path: string
  lineSnippet?: string
  isOutsideWorkspace?: boolean
  key: string
  content?: string // full path
}

interface BatchFilePermissionProps {
  files: FilePermissionItem[]
  onPermissionResponse?: (response: { [key: string]: boolean }) => void
  ts: number
}

export const BatchFilePermission = memo(({ files = [], onPermissionResponse, ts }: BatchFilePermissionProps) => {
  // Don't render if there are no files or no response handler
  if (!files?.length || !onPermissionResponse) {
    return null
  }

  return (
    <div className="flex flex-col gap-0 border border-border rounded-md pl-6">
      {files.map((file, index) => {
        return (
          <ToolUseBlock key={`${file.path}-${index}-${ts}`}>
            <ToolUseBlockHeader onClick={() => vscode.postMessage({ type: "openFile", text: file.content })}>
              {file.path?.startsWith(".") && <span>.</span>}
              <PathTooltip
                content={formatPathTooltip(file.path, file.lineSnippet ? ` ${file.lineSnippet}` : undefined)}>
                <span className="whitespace-nowrap overflow-hidden text-ellipsis text-left mr-2 rtl">
                  {formatPathTooltip(file.path, file.lineSnippet ? ` ${file.lineSnippet}` : undefined)}
                </span>
              </PathTooltip>
              <div className="flex-grow"></div>
              <span className="codicon codicon-link-external text-[13.5px] my-[1px]" />
            </ToolUseBlockHeader>
          </ToolUseBlock>
        )
      })}
    </div>
  )
})

BatchFilePermission.displayName = "BatchFilePermission"
