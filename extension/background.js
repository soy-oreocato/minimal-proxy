// Minimal Proxy — Background Script

const DEFAULT_PROXY = {
  host: "127.0.0.1",
  port: 8080
};

let state = { enabled: false, proxy: DEFAULT_PROXY, hasPrivateWindowPermission: false };

function applyProxy() {
  let proxyConfig;
  if (state.enabled) {
    proxyConfig = {
      proxyType: "manual",
      http: `${state.proxy.host}:${state.proxy.port}`,
      ssl: `${state.proxy.host}:${state.proxy.port}`,
      ftp: `${state.proxy.host}:${state.proxy.port}`,
      socks: `${state.proxy.host}:${state.proxy.port}`,
      socksVersion: 5,
      noProxyFor: ["localhost", "127.0.0.1"]
    };
  } else {
    proxyConfig = { proxyType: "system" };
  }

  browser.proxy.settings.set({ value: proxyConfig })
    .then(() => {
      updateIcon();
    })
    .catch(() => {});
}

function updateIcon() {
   const color = state.enabled ? "#2ecc71" : "#808080";
   
   // Update icon based on state
   const iconPath = state.enabled 
     ? {
         "16": "icons/icon-on-16.svg",
         "32": "icons/icon-on-32.svg"
       }
     : {
         "16": "icons/icon-off-16.svg",
         "32": "icons/icon-off-32.svg"
       };
   
   browser.browserAction.setIcon({ path: iconPath });
   browser.browserAction.setBadgeText({ text: "" });
   browser.browserAction.setBadgeBackgroundColor({ color });
   browser.browserAction.setTitle({
     title: state.enabled
       ? `Proxy: ${state.proxy.host}:${state.proxy.port}`
       : "Proxy: OFF (Direct)"
   });
}

function checkPrivateWindowPermission() {
   browser.extension.isAllowedIncognitoAccess()
     .then((isAllowed) => {
       const hadPermission = state.hasPrivateWindowPermission;
       state.hasPrivateWindowPermission = isAllowed;
       
       // If permission was revoked and proxy is enabled, disable it
       if (hadPermission && !isAllowed && state.enabled) {
         state.enabled = false;
         applyProxy();
       }
       
       saveState();
     })
     .catch(() => {
       state.hasPrivateWindowPermission = false;
     });
}

function saveState() {
  return browser.storage.local.set({ proxyState: state });
}

// Init on startup
browser.storage.local.get("proxyState").then((data) => {
   if (data.proxyState) {
     state.enabled = data.proxyState.enabled;
     state.proxy = data.proxyState.proxy;
     state.hasPrivateWindowPermission = data.proxyState.hasPrivateWindowPermission || false;
   }
   checkPrivateWindowPermission();
   applyProxy();
}).catch(() => {
   checkPrivateWindowPermission();
   applyProxy();
});

// Listen for messages from popup
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
   if (msg.action === "getState") {
     sendResponse(state);
     return;
   }

   if (msg.action === "checkPermission") {
     checkPrivateWindowPermission();
     sendResponse({ success: true });
     return true;
   }

   if (msg.action === "toggle") {
     state.enabled = !state.enabled;
     saveState();
     applyProxy();
     sendResponse({ ...state });
     return true;
   }

   if (msg.action === "updateProxy") {
     state.proxy = { ...state.proxy, ...msg.proxy };
     saveState();
     if (state.enabled) applyProxy();
     sendResponse({ ...state });
     return true;
   }
});
