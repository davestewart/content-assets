export function matchTokens(value) {
  let tokens = [];
  if (typeof value === "string") {
    tokens = value.match(/[^\s,|]+/g) || [];
  } else if (Array.isArray(value)) {
    tokens = value.filter((value2) => typeof value2 === "string").reduce((output, input) => {
      return [...output, ...matchTokens(input)];
    }, []);
  } else if (!!value && typeof value === "object") {
    tokens = Object.values(value).reduce((output, value2) => {
      return [...output, ...matchTokens(value2)];
    }, []);
  }
  return tokens.length ? Array.from(new Set(tokens)) : tokens;
}
export function toPath(key) {
  return key.replaceAll(":", "/");
}
export function toKey(path) {
  return path.replaceAll("/", ":");
}
export function deKey(path) {
  return path.replace(/^[^:]+:/, "");
}
