import { defineNuxtPlugin, refreshNuxtData, useRuntimeConfig } from "#imports";
export default defineNuxtPlugin(async () => {
  if (import.meta.client) {
    const url = useRuntimeConfig().public.sockets?.wsUrl;
    const socket = await import("./setup.mjs").then(({ setupSocketClient }) => {
      return setupSocketClient(url, "content-assets");
    });
    if (socket) {
      socket.addHandler(({ data }) => {
        const { event, src, width, height } = data;
        if (event === "refresh") {
          refreshNuxtData();
        } else if (src) {
          const isUpdate = event === "update";
          document.querySelectorAll(`:is(img, video, source, embed, iframe):where([src^="${src}"])`).forEach((el) => {
            el.style.opacity = isUpdate ? "1" : "0.2";
            if (isUpdate) {
              const query = el.getAttribute("src").split("?")[1];
              const params = new URLSearchParams(query);
              params.set("time", String(Date.now()));
              if (width && height) {
                el.addEventListener("load", function onLoad() {
                  if (el.width && el.height) {
                    el.setAttribute("width", width);
                    el.setAttribute("height", height);
                  }
                  if (el.style.aspectRatio) {
                    el.style.aspectRatio = `${width} / ${height}`;
                  }
                  if (params.get("width")) {
                    params.set("width", width);
                    params.set("height", height);
                  }
                  el.removeEventListener("load", onLoad);
                });
              }
              el.setAttribute("src", `${src}?${params.toString()}`);
            }
          });
        }
      });
    }
  }
});
