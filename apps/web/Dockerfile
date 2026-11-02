# LasTresB · imagen de la web para el VPS (Next.js standalone). Contexto: raíz del monorepo.
#   docker build -f apps/web/Dockerfile --secret id=entorno,src=<archivo .env> --network host -t lastresb-web .
# El build genera páginas que leen la base (sitemap, SEO por oficio y localidad), así que necesita las variables.
# Van como secreto de BuildKit: se montan solo durante `next build` y no quedan en ninguna capa de la imagen.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY packages/config/package.json packages/config/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter @las3b/web...

FROM deps AS build
COPY . .
RUN --mount=type=secret,id=entorno,target=/app/apps/web/.env.production.local \
    pnpm --filter @las3b/web build

FROM node:22-slim AS app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 TZ=America/Bogota
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "apps/web/server.js"]
