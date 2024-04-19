import { walkBody, walkMeta, buildQuery, readFile, writeFile } from "../utils/index.mjs";
export function rewriteContent(path, asset) {
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
