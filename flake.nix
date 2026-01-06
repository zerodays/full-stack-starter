{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = {
    nixpkgs,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
        };
        nativeBuildInputs = with pkgs; [
          bun
          infisical
        ];
        buildInputs = [];
      in
        with pkgs; {
          devShells.default = mkShell {
            inherit buildInputs nativeBuildInputs;
          };
        }
    );
}
