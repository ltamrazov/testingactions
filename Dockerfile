# Base is just light node config with common tools to building
# for building npm packages
FROM mhart/alpine-node:12.18.3 AS build
# node_modules deps
RUN apk add --no-cache python make g++ \
    # sqitch
    perl-utils perl-dev perl-dbd-pg perl-app-cpanminus postgresql-client && \
    cpanm App::Sqitch --no-wget --notest --quiet

ENV TZ UTC
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN chmod -R u+x scripts

RUN npm run build

ENTRYPOINT [ "sh", "-c", "./scripts/wait-for test-db:5432 && npm run test" ]


FROM build AS pre-release

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules /app/node_modules

RUN npm prune --production


FROM mhart/alpine-node:slim-12 as release

RUN apk add --no-cache --virtual .build-deps build-base perl-dev  && \
    apk add --no-cache postgresql-client perl-app-cpanminus perl-dbd-pg && \
    cpanm App::Sqitch --no-wget --notest --quiet && \
    apk del .build-deps

ENV TZ UTC

WORKDIR /app

COPY --from=build /app/build /app/build

COPY --from=pre-release /app/package.json /app/package-lock.json ./
COPY --from=pre-release /app/node_modules /app/node_modules

COPY migrations migrations
