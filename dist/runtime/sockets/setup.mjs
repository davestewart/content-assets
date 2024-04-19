import { createWebSocket } from "./factory.mjs";
let client;
const plugin = "[Content Assets]";
const logger = {
  // eslint-disable-next-line no-console
  log: (...args) => console.log(plugin, ...args),
  // eslint-disable-next-line no-console
  warn: (...args) => console.warn(plugin, ...args)
};
export function setupSocketClient(url, channel, callback) {
  if (!client) {
    client = createWebSocket(url, logger);
    if (client === null) {
      return null;
    }
  }
  const instance = {
    addHandler(callback2) {
      if (client && typeof callback2 === "function") {
        client.addHandler((data) => {
          if (data.channel === channel) {
            return callback2(data);
          }
        });
      }
      return this;
    },
    send(data) {
      if (client) {
        client.send({ channel, data });
      }
      return this;
    }
  };
  if (callback) {
    instance.addHandler(callback);
  }
  return instance;
}
