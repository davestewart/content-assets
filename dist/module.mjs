import * as Fs from 'fs';
import Fs__default from 'fs';
import Path from 'crosspath';
import { useNuxt, createResolver, defineNuxtModule, addPlugin } from '@nuxt/kit';
import { visit, SKIP, CONTINUE } from 'unist-util-visit';
import { listen } from 'listhen';
import { WebSocketServer, WebSocket } from 'ws';
import githubDriver from 'unstorage/drivers/github';
import fsDriver from 'unstorage/drivers/fs';
import { createStorage } from 'unstorage';
import getImageSize from 'image-size';
import debounce from 'debounce';
import 'ohash';

function matchTokens(value) {
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
function toPath(key) {
  return key.replaceAll(":", "/");
}
function deKey(path) {
  return path.replace(/^[^:]+:/, "");
}

const extensions = {
  // used to get image size
  image: matchTokens("png jpg jpeg gif svg webp ico"),
  // unused for now
  media: matchTokens("mp3 m4a wav mp4 mov webm ogg avi flv avchd")
};
function makeIgnores(extensions2) {
  const included = matchTokens(extensions2).join("|");
  return `^(?:(?!(${included})).)+$`;
}

function removeQuery(path) {
  return path.replace(/\?.*$/, "");
}
function isExcluded(path) {
  return path.split("/").some((segment) => segment.startsWith(".") || segment.startsWith("_"));
}
function isImage(path) {
  const ext = Path.extname(path).substring(1);
  return extensions.image.includes(ext);
}
function isArticle(path) {
  return removeQuery(path).endsWith(".md");
}
function isAsset(path) {
  return !isArticle(path);
}

function walk(node, callback, filter) {
  function visit(node2, callback2, parent, key) {
    if (filter) {
      const result = filter(node2, key);
      if (result === false) {
        return;
      }
    }
    if (Array.isArray(node2)) {
      node2.forEach((value, index) => {
        visit(value, callback2, node2, index);
      });
    } else if (isObject(node2)) {
      Object.keys(node2).forEach((key2) => {
        visit(node2[key2], callback2, node2, key2);
      });
    } else {
      callback2(node2, parent, key);
    }
  }
  visit(node, callback, { node }, "node");
}
function isObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}

function walkMeta(content, callback) {
  walk(content, callback, (value, key) => !(String(key).startsWith("_") || key === "body"));
}
function walkBody(content, callback) {
  visit(content.body, (node) => node.type === "element", (node) => {
    const { tag, props } = node;
    const excluded = tags.exclude.includes(tag);
    if (excluded) {
      return SKIP;
    }
    const included = tags.include.includes(tag);
    if (included || !props) {
      return CONTINUE;
    }
    callback(node);
  });
}
const tags = {
  // unlikely to contain assets
  exclude: matchTokens({
    container: "pre code code-inline",
    formatting: "acronym abbr address bdi bdo big center cite del dfn font ins kbd mark meter progress q rp rt ruby s samp small strike sub sup time tt u var wbr",
    headers: "h1 h2 h3 h4 h5 h6",
    controls: "input textarea button select optgroup option label legend datalist output",
    media: "map area canvas svg",
    other: "style script noscript template",
    empty: "hr br"
  }),
  // may contain assets
  include: matchTokens({
    content: "main header footer section article aside details dialog summary data object nav blockquote div span p",
    table: "table caption th tr td thead tbody tfoot col colgroup",
    media: "figcaption figure picture",
    form: "form fieldset",
    list: "ul ol li dir dl dt dd",
    formatting: "strong b em i"
  }),
  // assets
  assets: "a img audio source track video embed"
};

const label = "[content-assets]";
function log(...data) {
  console.info(label, ...data);
}
function warn(...data) {
  console.warn(label, ...data);
}
function list(message, items) {
  log(`${message}:

${items.map((item) => `   - ${item}`).join("\n")}
`);
}

function buildQuery(...expr) {
  const output = expr.map((expr2) => expr2.replace(/^[?&]+|&+$/g, "")).filter((s) => s);
  if (output.length) {
    const [first, ...rest] = output;
    const isParam = (expr2) => /^[^?]+=[^=]+$/.test(expr2);
    return !isParam(first) ? rest.length > 0 ? first + (first.includes("?") ? "&" : "?") + rest.join("&") : first : "?" + output.join("&");
  }
  return "";
}

function readFile(path, asJson = false) {
  const text = Fs__default.readFileSync(path, { encoding: "utf8" });
  return asJson ? JSON.parse(text) : text;
}
function writeFile(path, data) {
  const text = typeof data === "object" ? JSON.stringify(data, null, "  ") : String(data);
  createFolder(Path.dirname(path));
  Fs__default.writeFileSync(path, text, { encoding: "utf8" });
}
async function writeBlob(path, data) {
  const buffer = Buffer.from(await data.arrayBuffer());
  createFolder(Path.dirname(path));
  Fs__default.writeFileSync(path, buffer);
}
function copyFile(src, trg) {
  createFolder(Path.dirname(trg));
  Fs__default.copyFileSync(src, trg);
}
function removeFile(src) {
  Fs__default.rmSync(src);
}
function createFolder(path) {
  Fs__default.mkdirSync(path, { recursive: true });
}
function removeFolder(path) {
  const isDownstream = path.startsWith(Path.resolve());
  if (isDownstream) {
    Fs__default.rmSync(path, { recursive: true, force: true });
  }
}
function removeEntry(path) {
  if (Fs__default.existsSync(path)) {
    if (isFile(path)) {
      removeFile(path);
    } else {
      removeFolder(path);
    }
  }
}
function isFile(path) {
  return Fs__default.lstatSync(path).isFile();
}

function createWebSocket() {
  const wss = new WebSocketServer({ noServer: true });
  const serve = (req, socket = req.socket, head = "") => wss.handleUpgrade(req, socket, head, (client) => wss.emit("connection", client, req));
  const broadcast = (data) => {
    data = JSON.stringify(data);
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  };
  const handlers = [];
  const addHandler = (callback) => {
    handlers.push(callback);
  };
  wss.on("connection", (socket) => {
    socket.addEventListener("message", (event) => {
      let data;
      try {
        data = JSON.parse(event.data || "{}");
      } catch (err) {
      }
      if (data) {
        handlers.forEach((callback) => callback(data));
      }
    });
  });
  return {
    wss,
    serve,
    broadcast,
    addHandler,
    close: () => {
      wss.clients.forEach((client) => client.close());
      return new Promise((resolve) => wss.close(resolve));
    }
  };
}

function makeChannelBroker(ws2) {
  const handlers = [];
  const broadcast = (channel, data) => {
    ws2.broadcast({ channel, data });
  };
  const addHandler = (channel, callback) => {
    handlers.push({ channel, callback });
  };
  ws2.addHandler(function(message) {
    if (isObject(message)) {
      const { channel } = message;
      handlers.filter((handler) => handler.channel === channel || handler.channel === "*").forEach((handler) => handler.callback(message));
    }
  });
  return {
    broadcast,
    addHandler
  };
}
const ws = createWebSocket();
const broker = makeChannelBroker(ws);
async function setupSocketServer(channel, handler) {
  const nuxt = useNuxt();
  nuxt.hook("nitro:init", async (nitro) => {
    if (!nuxt._socketServer) {
      const defaults = nuxt.options.runtimeConfig.content.watch.ws;
      const port = defaults.port.port;
      const { server, url } = await listen(() => "Nuxt Content Assets", {
        hostname: defaults.hostname,
        port: {
          port: port + 1,
          portRange: [
            port + 1,
            port + 40
          ]
        },
        showURL: false
      });
      nuxt._socketServer = server;
      server.on("upgrade", ws.serve);
      const wsUrl = url.replace("http", "ws");
      log(`Websocket listening on "${wsUrl}"`);
      nitro.options.runtimeConfig.public.sockets = {
        wsUrl
      };
      nitro.hooks.hook("close", async () => {
        await ws.close();
        await server.close();
      });
    }
  });
  const instance = {
    send(data) {
      broker.broadcast(channel, data);
      return this;
    },
    addHandler(callback) {
      broker.addHandler(channel, callback);
      return this;
    }
  };
  if (handler) {
    instance.addHandler(handler);
  }
  return instance;
}

function isAssetId(id) {
  const path = toPath(id);
  return !isExcluded(path) && isAsset(path);
}
function makeSourceStorage(source, key = "") {
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
function makeSourceManager(key, source, publicPath, callback) {
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

function makeAssetsManager(publicPath, shouldWatch = true) {
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
function getAssetPaths(srcDir, srcAbs) {
  const srcRel = Path.relative(srcDir, srcAbs);
  const srcAttr = "/" + srcRel;
  return {
    srcRel,
    srcAttr
  };
}
function getAssetSize(srcAbs) {
  if (isImage(srcAbs)) {
    try {
      return getImageSize(srcAbs);
    } catch (err) {
      warn(`could not read image "${srcAbs}`);
    }
  }
  return {};
}

function rewriteContent(path, asset) {
  const { parsed } = readFile(path, true);
  const { srcAttr, width, height } = asset;
  walkMeta(parsed, (value, parent, key) => {
    if (value.startsWith(srcAttr)) {
      parent[key] = parent[key].replace(/width=\d+&height=\d+/, `width=${width}&height=${height}`);
    }
  });
  walkBody(parsed, function(node) {
    const { tag, props } = node;
    if (tag === "img" && props?.src?.startsWith(srcAttr)) {
      props.src = buildQuery(srcAttr, `time=${Date.now()}`);
      if (props.width) {
        props.width = width;
      }
      if (props.height) {
        props.height = height;
      }
      if (props.style) {
        const ratio = `${width}/${height}`;
        if (typeof props.style === "string") {
          props.style = props.style.replace(/aspect-ratio: \d+\/\d+/, `aspect-ratio: ${ratio}`);
        } else if (props.style.aspectRatio) {
          props.style.aspectRatio = ratio;
        }
      }
    }
  });
  writeFile(path, { module: true, parsed });
  return parsed;
}

const resolve = createResolver(import.meta.url).resolve;
const meta = {
  name: "nuxt-content-assets",
  configKey: "contentAssets",
  compatibility: {
    nuxt: "^3.0.0"
  }
};
const module = defineNuxtModule({
  meta,
  defaults: {
    imageSize: "",
    contentExtensions: "md csv ya?ml json",
    debug: false
  },
  async setup(options, nuxt) {
    const buildPath = nuxt.options.buildDir;
    const modulesPath = nuxt.options.modulesDir.find((path) => Fs.existsSync(`${path}/nuxt-content-assets/cache`)) || "";
    if (!modulesPath) {
      warn("Unable to find cache folder!");
      if (nuxt.options.srcDir.endsWith("/playground")) {
        warn('Run "npm run dev:setup" to generate a new cache folder');
      }
    }
    const cachePath = modulesPath ? Path.resolve(modulesPath, "nuxt-content-assets/cache") : Path.resolve(buildPath, "content-assets");
    const publicPath = Path.join(cachePath, "public");
    const contentPath = Path.join(buildPath, "content-cache");
    const isDev = !!nuxt.options.dev;
    const isDebug = !!options.debug;
    if (isDebug) {
      log("Cleaning content-cache");
      log(`Cache path: "${Path.relative(".", cachePath)}"`);
    }
    removeEntry(contentPath);
    const { contentExtensions } = options;
    if (contentExtensions) {
      nuxt.options.content ||= {};
      if (nuxt.options.content) {
        nuxt.options.content.ignores ||= [];
      }
      const ignores = makeIgnores(contentExtensions);
      nuxt.options.content?.ignores.push(ignores);
    }
    const imageSizes = matchTokens(options.imageSize);
    const sources = Array.from(nuxt.options._layers).map((layer) => layer.config?.content?.sources).reduce((output, sources2) => {
      if (sources2 && !Array.isArray(sources2)) {
        Object.assign(output, sources2);
      }
      return output;
    }, {});
    if (Object.keys(sources).length === 0 || !sources.content) {
      const content = nuxt.options.srcDir + "/content";
      if (Fs.existsSync(content)) {
        sources.content = {
          driver: "fs",
          base: content
        };
      }
    }
    const assets = makeAssetsManager(publicPath, isDev);
    assets.init();
    function onAssetChange(event, absTrg) {
      let src = "";
      let width;
      let height;
      if (event === "update") {
        const oldAsset = isImage(absTrg) && imageSizes.length ? assets.getAsset(absTrg) : null;
        const newAsset = assets.setAsset(absTrg);
        width = newAsset.width;
        height = newAsset.height;
        if (oldAsset) {
          if (oldAsset.width !== newAsset.width || oldAsset.height !== newAsset.height) {
            newAsset.content.forEach(async (id) => {
              const path = Path.join(contentPath, "parsed", toPath(id));
              rewriteContent(path, newAsset);
            });
          }
        }
        src = newAsset.srcAttr;
      } else {
        const asset = assets.removeAsset(absTrg);
        if (asset) {
          src = asset.srcAttr;
        }
      }
      if (src && socket) {
        socket.send({ event, src, width, height });
      }
    }
    addPlugin(resolve("./runtime/sockets/plugin"));
    const socket = isDev && nuxt.options.content?.watch !== false ? await setupSocketServer("content-assets") : null;
    const managers = {};
    for (const [key, source] of Object.entries(sources)) {
      if (isDebug) {
        log(`Creating source "${key}"`);
      }
      managers[key] = makeSourceManager(key, source, publicPath, onAssetChange);
    }
    nuxt.hook("build:before", async function() {
      for (const [key, manager] of Object.entries(managers)) {
        const paths = await manager.init();
        paths.forEach((path) => assets.setAsset(path));
        if (isDebug) {
          list(`Copied "${key}" assets`, paths.map((path) => Path.relative(publicPath, path)));
        }
      }
    });
    nuxt.hook("close", async () => {
      await assets.dispose();
      for (const key in managers) {
        await managers[key].dispose();
      }
    });
    const pluginPath = resolve("./runtime/content/plugin");
    const makeVar = (name, value) => `export const ${name} = ${JSON.stringify(value)};`;
    const virtualConfig = [
      makeVar("publicPath", publicPath),
      makeVar("imageSizes", imageSizes),
      makeVar("debug", isDebug)
    ].join("\n");
    nuxt.hook("nitro:config", async (config) => {
      config.plugins ||= [];
      config.plugins.push(pluginPath);
      config.virtual ||= {};
      config.virtual[`#${meta.name}`] = () => {
        return virtualConfig;
      };
      config.publicAssets ||= [];
      config.publicAssets.push({
        dir: publicPath,
        maxAge: 60 * 60 * 24 * 7
        // 7 days
      });
    });
  }
});

export { module as default };
