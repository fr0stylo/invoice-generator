FROM node:lts-alpine

WORKDIR /app

# Copy package files for workspace setup
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Install all dependencies (includes workspaces)
RUN npm ci

# Copy source code
COPY . .

# Build both frontend and backend
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]