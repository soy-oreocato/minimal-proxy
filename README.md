# Minimal Proxy

A minimal HTTP proxy switcher for Firefox, ready for declarative installation on NixOS.

## What it does

Minimal Proxy lets you toggle all browser HTTP/HTTPS traffic through a configurable proxy with a single click. It intercepts every request using `browser.proxy.onRequest` and routes it through an HTTP CONNECT proxy or directly, depending on the toggle state.

## Features

- **One-click toggle** -- Enable/disable proxy routing instantly from the toolbar popup.

```
.
├── extension/
│   ├── manifest.json          # Manifest V2 definition
│   ├── background.js          # Proxy interception logic
│   ├── popup.html             # Popup UI (dark theme, embedded CSS)
│   ├── popup.js               # Popup interaction logic
│   └── icons/                 # SVG icons (on/off states, 16/32/48px)
├── flake.nix                  # Nix flake for NixOS packaging
├── flake.lock
└── minimal-proxy-1.1.0.xpi   # Pre-built signed extension
```

## Requirements

- Firefox 142.0 or later

## Installation on NixOS

The extension ships with a Nix flake that packages the signed `.xpi` for declarative installation via home-manager.

### 1. Add the flake input

In your `flake.nix`, add `minimal-proxy` as an input and pass to outputs via specialArgs:

```nix
#flake.nix
{
  inputs = {
    # ... your other inputs ...

    minimal-proxy = {
      url = "github:soy-oreocato/minimal-proxy";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, home-manager, minimal-proxy, ... }@inputs: {
    # Make sure 'inputs' is passed to your modules via specialArgs or extraSpecialArgs
    nixosConfigurations.your-host = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      specialArgs = { inherit inputs; };
      modules = [
        home-manager.nixosModules.home-manager
        ./hosts/your-host
      ];
    };
  };
}
```

### 2. Pass `inputs` to home-manager

In your host configuration (e.g. `hosts/your-host/default.nix`), make sure `inputs` is available to home-manager modules:

```nix
home-manager = {
  useGlobalPkgs = true;
  useUserPackages = true;
  extraSpecialArgs = { inherit inputs; };
  users.your-user = import ../../home;
};
```

### 3. Configure Firefox with the extension

Create or edit your Firefox home-manager module (e.g. `home/programs/firefox.nix`):

```nix
{ config, pkgs, inputs, ... }:

let
  minimalProxyPkg = inputs.minimal-proxy.packages.${pkgs.system}.default;
in
{
  programs.firefox = {
    enable = true;

    policies = {
      # Allow Minimal Proxy in private windows (required for the extension
      # to function -- it disables its toggle without this permission)
      ExtensionSettings = {
        "minimal-proxy@soy-oreocato" = {
          private_browsing = true;
        };
      };
    };

    profiles.default = {
      # Install the extension declaratively
      extensions.packages = [
        minimalProxyPkg
      ];

      settings = {
        # Auto-enable externally installed extensions (without this,
        # Firefox disables extensions not installed through AMO)
        "extensions.autoDisableScopes" = 0;
      };
    };
  };
}
```

### 4. Rebuild

```bash
sudo nixos-rebuild switch --flake /etc/nixos#your-host
```

Firefox will have Minimal Proxy installed and enabled on next launch, including in private windows.

### Notes

- `extensions.autoDisableScopes = 0` is critical. Without it, Firefox silently disables externally-installed extensions.
- The `private_browsing = true` policy is required because Minimal Proxy checks for incognito access and disables its toggle if the permission is missing.

## Author

**oreocato** -- [github.com/soy-oreocato](https://github.com/soy-oreocato)

## License
MIT
