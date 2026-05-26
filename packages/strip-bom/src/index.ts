const BOM_CODE_POINT = 0xfeff

/**
 * Strips a UTF-8 BOM (Byte Order Mark) from the beginning of a string,
 * if present. Returns the original string unchanged if no BOM is found.
 */
export function stripBom(str: string): string {
  return str.length > 0 && str.charCodeAt(0) === BOM_CODE_POINT ? str.slice(1) : str
}
