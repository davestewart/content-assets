import * as Fs from "fs";
import Path from "crosspath";
import getImageSize from "image-size";
import debounce from "debounce";
import { hash } from "ohash";
import { makeSourceStorage } from "./source.mjs";
import { isImage, warn, log, removeEntry } from "../utils/index.mjs";
export function makeAssetsManager(publicPath, shouldWatch = true) {
  const assetsKey = "assets.json";
  const assetsPath = Path.join(publicPath, "..");
  const storage = makeSourceStorage(assetsPath);
  if (shouldWatch) {
    void storage.watch(async (event, key) => {
      if (event === "update" && key === assetsKey) {
        await load();
      }
    });
  }
  const assets = {};
  async function load() {
    const data = await storage.getItem(assetsKey);
    Object.assign(assets, data || {});
  }
  const save = debounce(function() {
    void storage.setItem(assetsKey, assets);
  }, 50);
  function resolveAsset(content, relAsset, registerContent = false) {
    const srcDir = Path.dirname(content._file);
    const srcAsset = Path.join(srcDir, relAsset);
    const asset = assets[srcAsset];
    if (asset && registerContent) {
      const { _id } = content;
      if (!asset.content.includes(_id)) {
        asset.content.push(_id);
        save();
      }
    }
    return asset || {};
  }
  function setAsset(path) {
    const { srcRel, srcAttr } = getAssetPaths(publicPath, path);
    const { width, height } = getAssetSize(path);
    const oldAsset = assets[srcRel];
    const newAsset = {
      srcAttr,
      content: oldAsset?.content || [],
      width,
      height
    };
    assets[srcRel] = newAsset;
    save();
    return newAsset;
  }
  function getAsset(path) {
    const { srcRel } = getAssetPaths(publicPath, path);
    return srcRel ? { ...assets[srcRel] } : void 0;
  }
  function removeAsset(path) {
    const { srcRel } = getAssetPaths(publicPath, path);
    const asset = assets[srcRel];
    if (asset) {
      delete assets[srcRel];
      save();
    }
    return asset;
  }
  const init = () => {
    if (Fs.existsSync(publicPath)) {
      const names = Fs.readdirSync(publicPath);
      for (const name of names) {
        if (!/^\.git(ignore|keep)$/.test(name)) {
          removeEntry(Path.join(publicPath, name));
        }
      }
    }
  };
  void load();
  return {
    init,
    setAsset,
    getAsset,
    removeAsset,
    resolveAsset,
    dispose: async () => {
      await storage.unwatch();
      await storage.dispose();
    }
  };
}
export const replacers = {
  key: (src) => Path.dirname(src).split("/").filter((e) => e).shift() || "",
  path: (src) => Path.dirname(src),
  folder: (src) => Path.dirname(src).replace(/[^/]+\//, ""),
  file: (src) => Path.basename(src),
  name: (src) => Path.basename(src, Path.extname(src)),
  extname: (src) => Path.extname(src),
  ext: (src) => Path.extname(src).substring(1),
  hash: (src) => hash({ src })
};
export function interpolatePattern(pattern, src, warn2 = false) {
  return Path.join(pattern.replace(/\[\w+]/g, (match) => {
    const name = match.substring(1, match.length - 1);
    const fn = replacers[name];
    if (fn) {
      return fn(src);
    }
    if (warn2) {
      log(`Unknown output token ${match}`, true);
    }
    return match;
  }));
}
export function getAssetPaths(srcDir, srcAbs) {
  const srcRel = Path.relative(srcDir, srcAbs);
  const srcAttr = "/" + srcRel;
  return {
    srcRel,
    srcAttr
  };
}
export function getAssetSize(srcAbs) {
  if (isImage(srcAbs)) {
    try {
      return getImageSize(srcAbs);
    } catch (err) {
      warn(`could not read image "${srcAbs}`);
    }
  }
  return {};
}
