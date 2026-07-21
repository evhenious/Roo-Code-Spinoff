export const sanitizeFilename = (filename: string, options?: { replacement?: string }): string => {
  const replacement = options?.replacement ?? "_"
  return filename.replace(/[<>:"/\\|?*]/g, replacement).replace(/\.$/, "") // Remove trailing dot
}
