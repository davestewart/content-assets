import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { walk } from "./object.mjs";
import { matchTokens } from "./string.mjs";
export function walkMeta(content, callback) {
  walk(content, callback, (value, key) => !(String(key).startsWith("_") || key === "body"));
}
export function walkBody(content, callback) {
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
