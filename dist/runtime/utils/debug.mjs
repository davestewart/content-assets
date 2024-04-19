const label = "[content-assets]";
export function log(...data) {
  console.info(label, ...data);
}
export function warn(...data) {
  console.warn(label, ...data);
}
export function list(message, items) {
  log(`${message}:

${items.map((item) => `   - ${item}`).join("\n")}
`);
}
