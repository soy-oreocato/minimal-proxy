# Minimal Proxy
A minimal Firefox extension to toggle a proxy on/off with a single click. Built with simplicity in mind and packaged as a Nix flake for seamless integration with NixOS and Home Manager.
## Features
- One-click proxy toggle (enable / disable)
- Configurable host and port directly from the popup
- Three quick-access presets (A, B, C) for common local proxy ports
- Persists settings across browser restarts via `browser.storage.local`
- Visual status indicator and dynamic toolbar icon
- Detects private-window permission and disables the toggle when not granted
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
    homeConfigurations."YOUR_USER" = home-manager.lib.homeManagerConfiguration {
      pkgs = nixpkgs.legacyPackages.x86_64-linux;
      modules = [
        ./home.nix
        { _module.args.minimal-proxy = minimal-proxy; }
      ];
    };
  };
}
```
**Note**: Replace "YOUR_USER" with your NixOS user.

### 2. Install the extension in Home Manager
Firefox (Firefox 136+ / ESR 128.8+) requires extensions to be installed under a specific profile path.
Home Manager's `programs.firefox` module handles this automatically:
```nix
# home.nix
{ pkgs, minimal-proxy, ... }:
{
  programs.firefox = {
    enable = true;
    # Enable the extension in private windows 
    policies = {
      ExtensionSettings = {
        "minimal-proxy@soy-oreocato" = {
          private_browsing = true;
        };
      };
    };
    profiles.default = {
      extensions.packages = [
        minimal-proxy.packages.${pkgs.system}.default
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

For older Firefox versions (> Firefox 136 / ESR 128.8), you must grant the permission manually:
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