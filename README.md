# Calyptia Core Docker Desktop extension

Calyptia Core simplifies observability for Kubernetes, allowing the user to create a data pipeline with endpoints, processing rules for data enrichment, and allowing to deliver your data to several destinations like OpenSearch, New Relic, Splunk, and many others.

This extension installs the Calyptia Core instance inside your Kubernetes cluster.

## Demo

[![Calyptia Core for Docker Desktop](https://img.youtube.com/vi/weAzQEpybZ4/0.jpg)](https://www.youtube.com/watch?v=weAzQEpybZ4 "Calyptia Core for Docker Desktop")

## Usage

1. Ensure Docker Desktop is set up to allow extensions and start the Kubernetes cluster.
   - Go to Preferences -> Kubernetes -> Check "Enable kubernetes".
   - Go to Preferences -> Extensions -> Check "Enable Docker Extensions".
2. Install manually the extension by running:
   ```bash
    docker extension install calyptia/core-docker-desktop:0.4.1
   ```

   To update an existing version, run:

   ```
    docker extension update calyptia/core-docker-desktop:0.4.1
   ```
3. Navigate to the "Calyptia Core" option in the "Extensions" section of the Docker Desktop Dashboard to use.
   - Initially, it will trigger authentication against Calyptia Cloud via a simple URL.
   - It will then detect whether you have a local Kubernetes cluster or not and display an error message if not.
   - It will then check if that local Kubernetes cluster already has a Calyptia Core instance and provide the details on that if so.
   - If there is no local instance then it will offer the option to create one for you.

## FAQs

1. Please see platform-specific FAQs here: <https://docs.docker.com/desktop/faqs/general/>
2. The extensions section is a good starting point for more help specific to extensions: <https://docs.docker.com/desktop/extensions/>
3. The Docker documentation has an extensive troubleshooting section: <https://docs.docker.com/desktop/troubleshoot/overview/>
4. Ensure the correct [context](https://docs.docker.com/engine/context/working-with-contexts/) is set when using Docker Desktop particularly if Docker Engine is running as well: <https://docs.docker.com/desktop/faqs/linuxfaqs/#context>

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
