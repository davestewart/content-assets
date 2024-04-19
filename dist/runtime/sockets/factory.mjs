let ws;
function log(...args) {
}
export function createWebSocket(url, logger = { log, warn: log }) {
  if (!window.WebSocket) {
    logger.warn("Your browser does not support WebSocket");
    return null;
  }
  const onOpen = () => logger.log("WS connected!");
  const onError = (e) => {
    switch (e.code) {
      case "ECONNREFUSED":
        connect(true);
        break;
      default:
        logger.warn("Socket error:", e);
        break;
    }
  };
  const onClose = (e) => {
    if (e.code === 1e3 || e.code === 1005) {
      logger.log("Socket closed");
    } else {
      connect(true);
    }
  };
  const handlers = [];
  const onMessage = (message) => {
    let data;
    try {
      data = JSON.parse(message.data);
    } catch (err) {
      logger.warn("Error parsing message:", message.data);
      return;
    }
    handlers.forEach((handler) => handler(data));
  };
  const send = (data) => {
    if (ws) {
      ws.send(JSON.stringify(data));
    }
  };
  let retries = 0;
  const connect = (retry = false) => {
    if (retry) {
      retries++;
      if (retries < 5) {
        logger.log("Reconnecting...");
        setTimeout(connect, 1e3);
      } else {
        logger.warn("Giving up!");
      }
      return;
    }
    if (ws) {
      try {
        ws.close();
      } catch (err) {
      }
      ws = void 0;
    }
    if (url) {
      const wsUrl = `${url}ws`;
      logger.log(`WS connect to ${wsUrl}`);
      ws = new WebSocket(wsUrl);
      ws.onopen = onOpen;
      ws.onmessage = onMessage;
      ws.onerror = onError;
      ws.onclose = onClose;
    }
  };
  if (!ws) {
    connect();
  }
  return {
    connect,
    send,
    addHandler(callback) {
      if (typeof callback === "function") {
        handlers.push(callback);
      }
    }
  };
}
