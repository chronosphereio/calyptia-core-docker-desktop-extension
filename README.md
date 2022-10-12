# Calyptia Core Docker Desktop extension

A simple Docker Desktop extension to automate the usage of Calyptia CLI: <https://github.com/calyptia/cli>
This extension will automatically create a Calyptia Core local instance for you and register it with the Calyptia infrastructure for easy management via the Calyptia Core UI.

## Usage

1. Ensure Docker Desktop is set up to allow extensions and start the Kubernetes cluster.
2. If not installed, run `docker extension install ghcr.io/calyptia/core-docker-desktop:latest` to get the latest version.
   - Replace the container name or tag with any specific version you want to use.
3. To update an existing version, run `docker extension update ghcr.io/calyptia/core-docker-desktop:latest`.
4. Grab your project token from <https://cloud.calyptia.com> and use this when running the creation task.
5. Run the creation task from the extensions tab.

## Development

The code for the extension can all be built locally via the [`Makefile`](./Makefile): `make install-extension`

This creates a local container and installs it, next time you build run `make update-extension` to update this version.
