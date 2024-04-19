export function walk(node, callback, filter) {
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
export function isObject(data) {
  return data && typeof data === "object" && !Array.isArray(data);
}
