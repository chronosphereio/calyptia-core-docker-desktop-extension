# Calyptia Core Docker Desktop extension

A simple Docker Desktop extension to automate the usage of Calyptia CLI: <https://github.com/calyptia/cli>
This extension will automatically create a Calyptia Core local instance for you within the local K8S cluster created by Docker Desktop.
It will then register this instance with the Calyptia infrastructure for easy management via the Calyptia Core UI.

## Usage

1. Ensure Docker Desktop is set up to allow extensions and start the Kubernetes cluster.
   - Go to Preferences -> Kubernetes -> Check "Enable kubernetes".
   - Go to Preferences -> Extensions -> Check "Enable Docker Extensions".
2. Run `docker pull ghcr.io/calyptia/core-docker-desktop:latest` to ensure the local of the extension is updated.
   - Replace the container name or tag with any specific version you want to use.
3. Run `docker extension install ghcr.io/calyptia/core-docker-desktop:latest` to get the latest version.
   - To update an existing version, run `docker extension update ghcr.io/calyptia/core-docker-desktop:latest`.
4. Navigate to the "Calyptia Core" option in the "Extensions" section of the Docker Desktop Dashboard to use.
   - Initially it will trigger authentication against Calyptia Cloud via a simple URL.
   - It will then detect whether you have a local Kubernetes cluster or not and display an error message if not.
   - It will then check if that local Kubernetes cluster already has a Calyptia Core instance and provide the details on that if so.
   - If there is no local instance then it will offer the option to create one for you.

## Prerequisites

In order to run this extension, you must have Docker Desktop 4.12.0 or later installed.

Runtime Requirements:

- [Docker Desktop 4.12.0 or later](https://www.docker.com/products/docker-desktop/)

Development Recommendations:

- [Go programming language](https://go.dev/doc/install)
- [React reference](https://reactjs.org)
- [Docker Extensions CLI](https://github.com/docker/extensions-sdk)

## Development

The code for the extension can all be built locally via the [`Makefile`](./Makefile): `make install-extension`

This creates a local container and installs it, next time you build run `make update-extension` to update this version.

Note: The build steps assume that the [Docker Extensions CLI](https://docs.docker.com/desktop/extensions-sdk) is present.
