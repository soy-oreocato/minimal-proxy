{
  description = "Minimal Proxy - A Minimal Proxy Switch ready for NixOS";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in {
          default = pkgs.stdenvNoCC.mkDerivation {
            pname = "minimal-proxy";
            version = "1.0.0";
            src = ./minimal-proxy-1.0.0.xpi;

            dontUnpack = true;

            installPhase = ''
              mkdir -p $out/share/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}
              cp $src $out/share/mozilla/extensions/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/minimal-proxy@soy-oreocato.xpi
            '';
            
            passthru = {
              addonId = "minimal-proxy@soy-oreocato";
              meta.mozPermissions = [ "proxy" "storage" ];
            };

          };
        });
    };
}
