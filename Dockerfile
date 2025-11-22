FROM oven/bun:1.3.3-alpine AS builder

WORKDIR /BS

COPY bun.lock package.json prisma.config.ts /BS/

RUN bun install --ignore-scripts --frozen-lockfile

COPY . /BS

RUN bun run minify

FROM oven/bun:1.3.3-alpine

WORKDIR /app

COPY --from=builder /BS/.dist /app/.dist
COPY --from=builder /BS/package.json /app/
COPY --from=builder /BS/prisma /app/prisma
COPY --from=builder /BS/prisma.config.ts /app/

EXPOSE 5000 5001 5002

CMD ["bun", "run", "prod"]
