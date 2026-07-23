FROM node:20-alpine AS base
WORKDIR /app

# Copy root package.json for workspaces
COPY package.json package-lock.json* ./
COPY server/package.json ./server/

# Install production dependencies only for server
RUN npm install --workspace=server --omit=dev

# Copy server source
COPY server/ ./server/

# Set working directory to server
WORKDIR /app/server

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start production server
CMD ["node", "src/server.js"]
