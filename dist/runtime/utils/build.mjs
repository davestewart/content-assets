export function buildStyle(...expr) {
  return expr.map((expr2) => expr2.replace(/^[; ]+|[; ]+$/g, "")).filter((s) => s).join(";").replace(/\s*;\s*/g, "; ") + ";";
}
export function buildQuery(...expr) {
  const output = expr.map((expr2) => expr2.replace(/^[?&]+|&+$/g, "")).filter((s) => s);
  if (output.length) {
    const [first, ...rest] = output;
    const isParam = (expr2) => /^[^?]+=[^=]+$/.test(expr2);
    return !isParam(first) ? rest.length > 0 ? first + (first.includes("?") ? "&" : "?") + rest.join("&") : first : "?" + output.join("&");
  }
  return "";
}
