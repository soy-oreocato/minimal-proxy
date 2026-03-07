# Minimal Proxy
A minimal Firefox extension to toggle a proxy on/off with a single click. Built with simplicity in mind and packaged as a Nix flake for seamless integration with NixOS and Home Manager.
## Features
- One-click proxy toggle (enable / disable)
- Configurable host and port directly from the popup
- Three quick-access presets (A, B, C) for common local proxy ports
- Persists settings across browser restarts via `browser.storage.local`
- Visual status indicator and dynamic toolbar icon
- Detects private-window permission and disables the toggle when not granted
## Screenshots
| Proxy OFF | Proxy ON |
|-----------|----------|
| Status bar shows **DIRECT — No Proxy** | Status bar shows **PROXY — host:port** |
## Manual Installation (without Nix)
1. Open Firefox and navigate to `about:debugging`.
2. Click **This Firefox** → **Load Temporary Add-on**.
3. Select the `manifest.json` file inside the `Minimal-Proxy/` directory.
For a permanent installation, sign the extension through [addons.mozilla.org](https://addons.mozilla.org) or use an enterprise policy.
---
## NixOS / Home Manager Installation (Flake)
### 1. Add the flake input
In your `flake.nix`:
```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    minimal-proxy = {
      url = "github:soy-oreocato/minimal-proxy";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs = { nixpkgs, home-manager, minimal-proxy, ... } @ inputs: {
    homeConfigurations."oreocato" = home-manager.lib.homeManagerConfiguration {
      pkgs = nixpkgs.legacyPackages.x86_64-linux;
      modules = [
        ./home.nix
        { _module.args.minimal-proxy = minimal-proxy; }
      ];
    };
  };
}
```
### 2. Install the extension in Home Manager
Firefox requires extensions to be installed under a specific profile path.
Home Manager's `programs.firefox` module handles this automatically:
```nix
# home.nix
{ pkgs, minimal-proxy, ... }:
let
  minimalProxyPkg = minimal-proxy.packages.${pkgs.system}.default;
in
{
  programs.firefox = {
    enable = true;
    profiles.default = {
      extensions.packages = [
        minimalProxyPkg
      ];
    };
  };
}
```
> **Note:** The `extensions.packages` option is available in Home Manager 24.05+.
> The package installs a signed `.xpi` file to
> `~/.mozilla/extensions/` so Firefox picks it up automatically.
### 3. Apply the configuration
```bash
home-manager switch --flake .#YOUR_USER
```
Or, if you manage Home Manager as a NixOS module:
```bash
sudo nixos-rebuild switch --flake .#YOUR_HOST
```
### Private Window Support
By default, Firefox does not allow extensions to run in private windows and this
permission cannot be set programmatically by the extension itself.
**Firefox 136+ / ESR 128.8+** introduced the `private_browsing` field in
`ExtensionSettings` enterprise policies, which lets you enable private-window
access declaratively. In Home Manager:
```nix
programs.firefox = {
  policies = {
    ExtensionSettings = {
      "your-extension-id@example" = {
        private_browsing = true;
      };
    };
  };
};
```
For older Firefox versions, you must grant the permission manually:
1. Go to `about:addons` → **Minimal Proxy** → **Details**.
2. Enable **Run in Private Windows**.
---
## Project Structure
```
.
├── flake.nix          # Nix flake — builds the .xpi package
└── extension/         # Extension source
    ├── manifest.json
    ├── background.js  # Proxy logic & state management
    ├── popup.html     # Extension popup UI
    ├── popup.js       # Popup interaction logic
    └── icons/         # SVG icons (on/off, 16/32/48 px)
```
## Permissions Used
| Permission | Reason |
|------------|--------|
| `proxy`    | Read and write Firefox proxy settings |
| `storage`  | Persist host, port and enabled state |
## License
MIT