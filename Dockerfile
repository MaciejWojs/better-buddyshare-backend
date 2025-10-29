FROM oven/bun:1.3.1-alpine AS builder

WORKDIR /BS

COPY bun.lock package.json /BS/

RUN bun install --frozen-lockfile

COPY . /BS

RUN bun run minify

FROM oven/bun:1.3.1-alpine

WORKDIR /app

COPY --from=builder /BS/.dist /app/.dist
COPY --from=builder /BS/package.json /app/
COPY --from=builder /BS/prisma /app/prisma

EXPOSE 5000 5001 5002

CMD ["bun", "run", "prod"]
