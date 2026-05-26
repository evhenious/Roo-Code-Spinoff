// super simple override just to get rid of an external pkg
module.exports = function (str: unknown) {
  if (typeof str === "string" && str.charAt(0) === "\ufeff") {
    return str.slice(1)
  }
  return str
}
