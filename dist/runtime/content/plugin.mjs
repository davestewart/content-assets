import { buildQuery, buildStyle, isValidAsset, list, parseQuery, removeQuery, walkBody, walkMeta } from "../utils/index.mjs";
import { makeAssetsManager } from "../assets/public.mjs";
import { debug, imageSizes, publicPath } from "#nuxt-content-assets";
const plugin = async (nitro) => {
  function processMeta(content, imageSizes2 = [], updated = []) {
    walkMeta(content, (value, parent, key) => {
      if (isValidAsset(value)) {
        const { srcAttr, width, height } = resolveAsset(content, removeQuery(value), true);
        if (srcAttr) {
          const query = width && height && (imageSizes2.includes("src") || imageSizes2.includes("url")) ? `width=${width}&height=${height}` : "";
          const srcUrl = query ? buildQuery(srcAttr, parseQuery(value), query) : srcAttr;
          parent[key] = srcUrl;
          updated.push(`meta: ${key} to "${srcUrl}"`);
        }
      }
    });
  }
  function processBody(content, imageSizes2 = [], updated = []) {
    walkBody(content, function(node) {
      const { tag, props } = node;
      for (const [prop, value] of Object.entries(props)) {
        if (typeof value !== "string") {
          return;
        }
        const { srcAttr, width, height } = resolveAsset(content, value, true);
        if (srcAttr) {
          node.props[prop] = srcAttr;
          if (node.tag === "img" || node.tag === "nuxt-img") {
            if (width && height) {
              if (imageSizes2.includes("attrs")) {
                node.props.width = width;
                node.props.height = height;
              }
              if (imageSizes2.includes("style")) {
                const ratio = `${width}/${height}`;
                if (typeof node.props.style === "string") {
                  node.props.style = buildStyle(node.props.style, `aspect-ratio: ${ratio}`);
                } else {
                  node.props.style ||= {};
                  node.props.style.aspectRatio = ratio;
                }
              }
            }
          } else if (node.tag === "a") {
            node.props.target ||= "_blank";
          }
          updated.push(`page: ${tag}[${prop}] to "${srcAttr}"`);
        }
      }
    });
  }
  const { resolveAsset, dispose } = makeAssetsManager(publicPath, import.meta.dev);
  nitro.hooks.hook("content:file:afterParse", function(content) {
    if (content._extension === "md") {
      const updated = [];
      processMeta(content, imageSizes, updated);
      processBody(content, imageSizes, updated);
      if (debug && updated.length) {
        list(`Processed "/${content._file}"`, updated);
        console.log();
      }
    }
  });
  nitro.hooks.hook("close", dispose);
};
export default plugin;
