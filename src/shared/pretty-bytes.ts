export const prettyBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB", "PB"]
  const isNegative = bytes < 0
  bytes = Math.abs(bytes)

  const unitIndex = Math.floor(Math.log10(bytes) / 3)
  const value = bytes / Math.pow(1000, unitIndex)

  return `${isNegative ? "-" : ""}${value.toFixed(2)} ${units[unitIndex]}`
}
