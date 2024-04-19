import Path from "crosspath";
import { extensions } from "./config.mjs";
export function parseQuery(path) {
  const matches = path.match(/\?.+$/);
  return matches ? matches[0] : "";
}
export function removeQuery(path) {
  return path.replace(/\?.*$/, "");
}
export function isRelative(path) {
  return !(path.startsWith("http") || Path.isAbsolute(path));
}
export function isExcluded(path) {
  return path.split("/").some((segment) => segment.startsWith(".") || segment.startsWith("_"));
}
export function isImage(path) {
  const ext = Path.extname(path).substring(1);
  return extensions.image.includes(ext);
}
export function isArticle(path) {
  return removeQuery(path).endsWith(".md");
}
export function isAsset(path) {
  return !isArticle(path);
}
export function isValidAsset(value) {
  return typeof value === "string" && isAsset(value) && isRelative(value);
}
