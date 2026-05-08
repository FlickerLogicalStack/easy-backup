FROM oven/bun:1.3.13

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY shared/ ./shared/
COPY server/ ./server/

RUN mkdir -p /data

VOLUME ["/data"]

EXPOSE 3000

CMD ["bun", "run", "server/server.ts", "-c", "config.json"]
