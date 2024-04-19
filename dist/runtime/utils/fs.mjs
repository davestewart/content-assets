import Path from "crosspath";
import Fs from "fs";
export function readFile(path, asJson = false) {
  const text = Fs.readFileSync(path, { encoding: "utf8" });
  return asJson ? JSON.parse(text) : text;
}
export function writeFile(path, data) {
  const text = typeof data === "object" ? JSON.stringify(data, null, "  ") : String(data);
  createFolder(Path.dirname(path));
  Fs.writeFileSync(path, text, { encoding: "utf8" });
}
export async function writeBlob(path, data) {
  const buffer = Buffer.from(await data.arrayBuffer());
  createFolder(Path.dirname(path));
  Fs.writeFileSync(path, buffer);
}
export function copyFile(src, trg) {
  createFolder(Path.dirname(trg));
  Fs.copyFileSync(src, trg);
}
export function removeFile(src) {
  Fs.rmSync(src);
}
export function createFolder(path) {
  Fs.mkdirSync(path, { recursive: true });
}
export function removeFolder(path) {
  const isDownstream = path.startsWith(Path.resolve());
  if (isDownstream) {
    Fs.rmSync(path, { recursive: true, force: true });
  }
}
export function removeEntry(path) {
  if (Fs.existsSync(path)) {
    if (isFile(path)) {
      removeFile(path);
    } else {
      removeFolder(path);
    }
  }
}
export function isFile(path) {
  return Fs.lstatSync(path).isFile();
}
