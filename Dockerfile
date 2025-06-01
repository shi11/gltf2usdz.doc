FROM marlon360/usd-from-gltf:latest

ENV NODE_ENV production
ENV APP_DIR /usr/app/gltf2usdz
ENV BUN_VERSION "1.0.35"
ENV BUN_INSTALL="/root/.bun"
ENV PATH=$BUN_INSTALL/bin:$PATH

# Install system dependencies
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get update -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    curl \
    unzip \
    zsh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set zsh as default shell
SHELL ["/bin/zsh", "-c"]

# Create and set working directory
WORKDIR ${APP_DIR}

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash

# Copy all package files first for workspaces
COPY package.json bun.lockb ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install dependencies
RUN bun install

# Copy the rest of the application
COPY client ./client
COPY server ./server

# Build client
WORKDIR ${APP_DIR}/client
RUN bun run build

# Prepare server
WORKDIR ${APP_DIR}/server

# Create necessary directories with proper permissions
RUN mkdir -p ${APP_DIR}/files ${APP_DIR}/logs && \
    chmod -R 777 ${APP_DIR}/files ${APP_DIR}/logs

EXPOSE 4000

ENTRYPOINT ["bun", "run", "start"]