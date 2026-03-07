const $ = (s) => document.querySelector(s);
const toggle = $("#toggle");
const toggleSwitch = document.querySelector(".switch");
const statusEl = $("#status");
const hostEl = $("#host");
const portEl = $("#port");
const permissionEl = $("#privateWindowPermission");

function render(state) {
   toggle.checked = state.enabled;
   hostEl.value = state.proxy.host;
   portEl.value = state.proxy.port;
   if (state.enabled) {
     statusEl.textContent = `PROXY — ${state.proxy.host}:${state.proxy.port}`;
     statusEl.className = "status on";
   } else {
     statusEl.textContent = "DIRECT — No Proxy";
     statusEl.className = "status off";
   }
   
   // Update private window permission status
   if (state.hasPrivateWindowPermission) {
     permissionEl.style.display = "none";
     toggleSwitch.classList.remove("disabled");
     toggle.disabled = false;
   } else {
     permissionEl.textContent = "✗ Run in private windows: Disabled";
     permissionEl.className = "permission-info disabled";
     permissionEl.style.display = "block";
     toggleSwitch.classList.add("disabled");
     toggle.disabled = true;
     // Reset toggle state when permission is disabled
     toggle.checked = false;
     state.enabled = false;
   }
}

// Init
function loadState() {
   // Check permission first to ensure we have the latest state
   browser.runtime.sendMessage({ action: "checkPermission" })
     .then(() => {
       browser.runtime.sendMessage({ action: "getState" })
         .then((state) => {
           if (!state) return;
           render(state);
         })
         .catch(() => {});
     })
     .catch(() => {
       browser.runtime.sendMessage({ action: "getState" })
         .then((state) => {
           if (!state) return;
           render(state);
         })
         .catch(() => {});
     });
}

loadState();

// Reload state when popup opens/refocuses
window.addEventListener("focus", () => {
  loadState();
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    loadState();
  }
});

// Toggle
toggle.addEventListener("change", () => {
   if (toggle.disabled) {
     return;
   }
   browser.runtime.sendMessage({ action: "toggle" })
     .then((state) => {
       render(state);
     })
     .catch(() => {});
});

// Update proxy on input change
function updateProxy() {
  const host = hostEl.value.trim() || "127.0.0.1";
  const port = parseInt(portEl.value, 10) || 8080;
  browser.runtime.sendMessage({
    action: "updateProxy",
    proxy: { host, port }
  })
    .then((state) => {
      render(state);
    })
    .catch(() => {});
}

hostEl.addEventListener("change", updateProxy);
portEl.addEventListener("change", updateProxy);

// Presets
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    hostEl.value = btn.dataset.host;
    portEl.value = btn.dataset.port;
    updateProxy();
  });
});
