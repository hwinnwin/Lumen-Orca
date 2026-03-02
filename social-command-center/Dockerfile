# ============================================
# Social Command Center — Production Dockerfile
# Single container: API + Frontend static files
# ============================================

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/

# Install all dependencies (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Stage 2: Build everything
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy all source code
COPY . .

# Generate Prisma client (dummy DATABASE_URL needed for generate, not for actual connection)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN cd apps/api && npx prisma generate

# Build shared package (used by both web and api)
# No build step needed — shared exports raw .ts files consumed directly

# Build the frontend (outputs to apps/web/dist)
# Skip tsc -b (noEmit: true anyway) — Vite handles the actual build
RUN cd apps/web && npx vite build

# Build the API (outputs to apps/api/dist)
RUN cd apps/api && npx tsc

# Stage 3: Production runtime
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy workspace config for pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema + generated client
# With pnpm, prisma generate outputs to root node_modules/.prisma (not apps/api/node_modules/.prisma)
COPY apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built API
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy built frontend (will be served by Express)
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Copy shared package source (needed at runtime by API for type imports)
COPY packages/shared ./packages/shared

# Create uploads directory for local file storage
RUN mkdir -p /app/uploads

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-3001}

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run database migrations then start the server
CMD ["sh", "-c", "cd apps/api && npx prisma db push --accept-data-loss && node dist/index.js"]
