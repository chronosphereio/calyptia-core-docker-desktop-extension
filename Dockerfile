FROM --platform=$BUILDPLATFORM node:18.10.0-alpine3.16 AS client-builder

WORKDIR /ui
# cache packages in layer
COPY ui/package.json /ui/package.json
COPY ui/package-lock.json /ui/package-lock.json
RUN --mount=type=cache,target=/usr/src/app/.npm npm set cache /usr/src/app/.npm && npm ci

# install
COPY ui /ui
RUN npm run build

# hadolint ignore=DL3006
FROM alpine

# These are all required to be present in order to be published:
# https://docs.docker.com/desktop/extensions-sdk/extensions/labels/
# Technically some of these labels are "invalid" as they're reserved! https://docs.docker.com/config/labels-custom-metadata/
# hadolint ignore=DL3048
LABEL org.opencontainers.image.title="calyptia-core-docker-desktop" \
    org.opencontainers.image.description="Use Calyptia Core within Docker Desktop to manage observability." \
    org.opencontainers.image.vendor="Calyptia Inc." \
    com.docker.desktop.extension.api.version=">= 0.2.3" \
    com.docker.extension.detailed-description="This extension automates integration with Calyptia Core to create an instance in your local Docker Desktop Kubernetes cluster. \
    It will allow you to use, evaluate and test Calyptia Core without needing to deploy or use a Kubernetes cluster. \
    For full details and a demo please see https://calyptia.com/products/calyptia-core." \
    com.docker.extension.publisher-url="https://www.calyptia.com" \
    com.docker.extension.changelog="Integration with Calyptia Core UI and automated authentication." \
    com.docker.desktop.extension.icon="https://storage.googleapis.com/calyptia_public_resources_bucket/docker-desktop/calyptia.svg" \
    com.docker.extension.screenshots='[\
    {"alt": "Main page", "url": "https://storage.googleapis.com/calyptia_public_resources_bucket/docker-desktop/screenshots/login.png"},\
    {"alt": "Existing core instance", "url": "https://storage.googleapis.com/calyptia_public_resources_bucket/docker-desktop/screenshots/existing-cluster.png"},\
    {"alt": "Core overview", "url": "https://storage.googleapis.com/calyptia_public_resources_bucket/docker-desktop/core-overview.png"}\
    ]' \
    com.docker.extension.additional-urls='[\
    {"title":"Overview","url":"https://calyptia.com/products/calyptia-core/"},\
    {"title":"Documentation","url":"https://docs.calyptia.com/"}, \
    {"title":"Support","url":"https://support.calyptia.com/"}]'

# hadolint ignore=DL3018
RUN apk add --no-cache curl

SHELL ["/bin/ash", "-eo", "pipefail", "-c"]
RUN curl -LO "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl" \
    && chmod +x ./kubectl && mv ./kubectl /usr/local/bin/kubectl \
    && curl -sSfL https://github.com/calyptia/cli/releases/download/v0.40.0/cli_0.40.0_linux_amd64.tar.gz | tar -xz \
    && chmod +x ./calyptia && mv ./calyptia /usr/local/bin/calyptia \
    && mkdir -p /linux \
    && cp /usr/local/bin/kubectl /linux/ \
    && cp /usr/local/bin/calyptia /linux/

RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl" \
    && curl -sSfL https://github.com/calyptia/cli/releases/download/v0.40.0/cli_0.40.0_darwin_amd64.tar.gz | tar -xz \
    && mkdir -p /darwin \
    && chmod +x ./calyptia && mv ./calyptia /darwin/ \
    && chmod +x ./kubectl && mv ./kubectl /darwin/

RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/windows/amd64/kubectl.exe" \
    && curl -sSfL https://github.com/calyptia/cli/releases/download/v0.40.0/cli_0.40.0_windows_amd64.tar.gz | tar -xz \
    && mkdir -p /windows \
    && chmod +x ./calyptia.exe && mv ./calyptia.exe /windows/ \
    && chmod +x ./kubectl.exe && mv ./kubectl.exe /windows/ 

WORKDIR /
COPY LICENSE.txt .
COPY metadata.json .
COPY calyptia.svg .
COPY --from=client-builder /ui/build ui
