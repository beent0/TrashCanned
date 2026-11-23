# One Dockerfile, one image per deployment: docker build --target <experience|core|monitorizacao> .
FROM node:24-alpine AS backend-build
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ .
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=backend-build /app/package.json ./
COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main"]

FROM runtime AS core
ENV SERVICE=core

FROM runtime AS monitorizacao
ENV SERVICE=monitorizacao

FROM runtime AS experience
ENV SERVICE=experience
COPY --from=frontend-build /app/dist ./public
