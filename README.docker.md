# Docker Setup

This document describes the multi-stage Docker setup for the invoice generator.

## Multi-Stage Build

The Dockerfile uses a multi-stage build approach:

### Stage 1: Builder
- Uses `node:lts-alpine` as the base image
- Installs all dependencies (including devDependencies)
- Builds both backend and frontend applications
- Creates compiled artifacts in `dist` and `build` directories

### Stage 2: Production
- Uses a fresh `node:lts-alpine` image
- Installs only production dependencies
- Copies built artifacts from the builder stage
- Sets up a non-root user for security
- Exposes port 3000

## Build Commands

```bash
# Build the Docker image
docker build -t invoice-generator:latest .

# Run the container
docker run -p 3000:3000 invoice-generator:latest

# Run with volume mounts for persistence
docker run -p 3000:3000 \
  -v $(pwd)/invoices:/app/invoices \
  -v $(pwd)/db.sqlite:/app/db.sqlite \
  invoice-generator:latest
```

## Docker Compose

Use the provided `docker-compose.yml` for easier management:

```bash
# Run production version
docker-compose up

# Run development version with hot reload
docker-compose --profile dev up invoice-generator-dev
```

## Production Artifacts

The production image contains only:
- Built backend JavaScript files (`apps/backend/dist/`)
- Built frontend assets (`apps/frontend/build/`)
- Fonts directory (`fonts/`)
- Configuration file (`contracts.yaml`)
- Production dependencies only

## Security Features

- Non-root user (`nodejs:nodejs`)
- Minimal attack surface (no dev dependencies)
- Health check endpoint (`/api/health`)
- Clean cache after dependency installation

## Image Size Optimization

The multi-stage build ensures:
- No source code in final image
- No development dependencies
- No build tools or TypeScript compiler
- Minimal Node.js Alpine base image
- Clean npm cache

## Environment Variables

- `NODE_ENV`: Set to `production`
- `PORT`: Server port (default: 3000)

## Volumes

Recommended volume mounts:
- `./invoices:/app/invoices` - Generated invoice files
- `./db.sqlite:/app/db.sqlite` - Database persistence