import Path from "crosspath";
import githubDriver from "unstorage/drivers/github";
import fsDriver from "unstorage/drivers/fs";
import { createStorage } from "unstorage";
import { warn, isAsset, toPath, removeFile, copyFile, writeBlob, writeFile, deKey, isExcluded } from "../utils/index.mjs";
function isAssetId(id) {
  const path = toPath(id);
  return !isExcluded(path) && isAsset(path);
}
export function makeSourceStorage(source, key = "") {
  const storage = createStorage();
  const options = typeof source === "string" ? { driver: "fs", base: source } : source;
  switch (options.driver) {
    case "fs":
      storage.mount(key, fsDriver({
        ...options,
        ignore: [
          "[^:]+?\\.md",
          "_dir\\.yml"
        ]
      }));
      break;
    case "github":
      storage.mount(key, githubDriver({
        branch: "main",
        dir: "/",
        ...options
      }));
      break;
  }
  return storage;
}
export function makeSourceManager(key, source, publicPath, callback) {
  async function onWatch(event, key2) {
    if (isAssetId(key2)) {
      const path = event === "update" ? await copyItem(key2) : removeItem(key2);
      if (callback) {
        callback(event, path);
      }
    }
  }
  function getRelSrc(key2) {
    return toPath(key2).replace(/\w+/, "").replace(source.prefix || "", "");
  }
  function getAbsSrc(key2) {
    return Path.join(source.base, getRelSrc(key2));
  }
  function getRelTrg(key2) {
    return Path.join(source.prefix || "", toPath(deKey(key2)));
  }
  function getAbsTrg(key2) {
    return Path.join(publicPath, getRelTrg(key2));
  }
  function removeItem(key2) {
    const absTrg = getAbsTrg(key2);
    removeFile(absTrg);
    return absTrg;
  }
  async function copyItem(key2) {
    const absTrg = getAbsTrg(key2);
    const driver = source.driver;
    if (driver === "fs") {
      const absSrc = getAbsSrc(key2);
      copyFile(absSrc, absTrg);
    } else if (driver === "github") {
      try {
        const data = await storage.getItem(key2);
        if (data) {
          data?.constructor.name === "Blob" ? await writeBlob(absTrg, data) : writeFile(absTrg, data);
        } else {
          warn(`No data for key "${key2}"`);
        }
      } catch (err) {
        warn(err.message);
      }
    }
    return absTrg;
  }
  async function getKeys() {
    const keys = await storage.getKeys();
    return keys.filter(isAssetId);
  }
  async function init() {
    const keys = await getKeys();
    const paths = [];
    for (const key2 of keys) {
      const path = await copyItem(key2);
      paths.push(path);
    }
    return paths;
  }
  const storage = makeSourceStorage(source, key);
  void storage.watch(onWatch);
  async function dispose() {
    await storage.unwatch();
    await storage.dispose();
  }
  return {
    storage,
    init,
    keys: getKeys,
    dispose
  };
}
