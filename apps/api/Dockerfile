FROM node:20-alpine

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json package-lock.json ./

# Copy the shared package
COPY packages/shared/ ./packages/shared/

# Copy the API package.json
COPY apps/api/package.json ./apps/api/

# Install all workspace dependencies
RUN npm ci --workspace=@buildflow/api --include-workspace-root

# Copy API source code
COPY apps/api/ ./apps/api/

EXPOSE 5001

CMD ["node", "apps/api/src/server.js"]
