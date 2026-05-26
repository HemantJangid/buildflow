FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json package-lock.json ./

# Copy the shared package
COPY packages/shared/ ./packages/shared/

# Copy the web package.json
COPY apps/web/package.json ./apps/web/

# Install all workspace dependencies
RUN npm ci --workspace=@buildflow/web --include-workspace-root

# Copy web source code
COPY apps/web/ ./apps/web/

EXPOSE 5173

CMD ["npx", "vite", "--host", "--port", "5173", "--config", "apps/web/vite.config.js"]
