# Use multi-stage build for smaller image
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source and build
COPY . .
RUN npm run build

# Runtime image
FROM node:20-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mgzon -u 1001

# Copy built app
COPY --from=builder --chown=mgzon:nodejs /app/package*.json ./
COPY --from=builder --chown=mgzon:nodejs /app/dist ./dist

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Make CLI executable
RUN chmod +x dist/index.js

# Switch to non-root user
USER mgzon

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('fs').existsSync('/app/dist/index.js') ? process.exit(0) : process.exit(1)"

# Default command
CMD ["./dist/index.js", "--help"]