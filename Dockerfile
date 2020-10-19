# Base is just light node config with common tools to building
# for building npm packages
FROM mhart/alpine-node:12.18.3 AS build

ENV TZ UTC

WORKDIR /app

COPY package.json package-lock.json ./

# node_modules deps
RUN apk add --no-cache --virtual .build-deps python make g++ perl-dev && \
    npm ci && \
    apk del .build-deps

COPY . .

RUN chmod -R u+x scripts

RUN npm run build

FROM build AS pre-release

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules /app/node_modules

RUN npm prune --production


FROM mhart/alpine-node:slim-12.18.3 as release

ENV TZ UTC

WORKDIR /app

COPY --from=build /app/build /app/build

COPY --from=pre-release /app/package.json /app/package-lock.json ./
COPY --from=pre-release /app/node_modules /app/node_modules

COPY migrations migrations

ENTRYPOINT [ "sh", "-c" ]