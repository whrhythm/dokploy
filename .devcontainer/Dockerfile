# Dockerfile for DevContainer
FROM node:24.4.0-bullseye-slim

# Install essential packages
RUN apt-get update && apt-get install -y \
    curl \
    bash \
    git \
    && apt-get clean \
    && apt-get update && apt-get install -y curl unzip zip apache2-utils iproute2 rsync git-lfs && git lfs install \
    && rm -rf /var/lib/apt/lists/*

# Set up PNPM
RUN mkdir -p /pnpm && chown node:node /pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate
ARG NIXPACKS_VERSION=1.41.0
RUN curl -sSL https://nixpacks.com/install.sh -o install.sh \
    && chmod +x install.sh \
    && ./install.sh \
    && pnpm install -g tsx
# Create workspace directory
WORKDIR /workspaces/dokploy

# Set up user permissions
USER node