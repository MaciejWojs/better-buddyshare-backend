# --- Etap 1: build bun binary ---------------------------------
FROM oven/bun:1.3.2-alpine AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --ignore-scripts --production --frozen-lockfile

COPY . .

RUN bun build src/index.ts --compile --minify --bun --outfile deleter

FROM ossrs/srs:6

COPY --from=builder /app/deleter /usr/local/bin/deleter

RUN ls -lah /usr/local/bin && chmod +x /usr/local/bin/deleter

EXPOSE 8080 7777

CMD ["bash", "-c", "srs -c /usr/local/srs/conf/srs.conf & /usr/local/bin/deleter"]