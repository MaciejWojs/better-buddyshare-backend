FROM oven/bun:1.3.1-alpine AS builder

WORKDIR /queue

COPY bun.lock package.json /queue/

RUN bun install --frozen-lockfile

COPY . /queue

RUN bun run minify

FROM oven/bun:1.3.1-alpine

WORKDIR /app

COPY --from=builder /queue/.dist /app/.dist
COPY --from=builder /queue/package.json /app/

EXPOSE 5000 5001 5002

CMD ["bun", "run", "prod"]
