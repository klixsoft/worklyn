# ─────────────────────────────────────────────
# Stage 1: deps  — install all node_modules
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies only when package files change
COPY package.json package-lock.json* ./
RUN npm ci

# ─────────────────────────────────────────────
# Stage 2: builder — compile the Next.js app
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js production bundle
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: runner — lean production image
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what's needed at runtime
COPY --from=builder /app/public       ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY docker/frontend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
