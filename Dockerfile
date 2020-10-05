# Base is just light node config with common tools to building
# for building npm packages
FROM mhart/alpine-node:12.18.3 AS build
# node_modules deps
RUN apk add --no-cache python make g++ && \
    # sqitch
    apk add --no-cache perl-utils perl-dev tzdata perl-dbd-pg perl-app-cpanminus postgresql-client && \
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

RUN apk add --no-cache \ 
    build-base perl-dev perl-dbd-pg perl-app-cpanminus

RUN apk add --no-cache postgresql-client && \
    cpanm App::Sqitch --no-wget --notest --quiet

ENV TZ UTC

WORKDIR /app

COPY --from=build /app/build /app/build

COPY --from=pre-release /app/package.json /app/package-lock.json ./
COPY --from=pre-release /app/node_modules /app/node_modules
