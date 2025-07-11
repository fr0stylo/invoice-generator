# Build stage
FROM node:lts-alpine AS builder

WORKDIR /app

# Copy package files for workspace setup
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Install all dependencies (includes devDependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build both frontend and backend
RUN npm run build:backend && npm run build:frontend

# Production stage
FROM node:lts-alpine AS production

WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built artifacts from build stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/frontend/build ./apps/frontend/build

# Copy fonts directory (required for PDF generation)
COPY fonts ./fonts

# Copy any other runtime files needed
COPY contracts.yaml ./contracts.yaml

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of app directory to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

CMD ["node", "apps/backend/dist/server.js"]