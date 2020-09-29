# Base is just light node config with common tools to building
# for building npm packages
FROM mhart/alpine-node:12.18.3 AS base

RUN apk add --no-cache gcc python perl-utils g++ make perl-dev tzdata openssh git curl perl-dbd-pg postgresql-client
RUN cpan App::cpanminus
RUN cpanm App::Sqitch --no-wget --notest --quiet
RUN rm -rf /root/.cpan


# Build is the base with the installed npm packages
FROM base AS build

ENV TZ UTC

WORKDIR /app
COPY package.json package-lock.json ./

RUN npm ci

# test creates the build for testing and can be used later for prod
FROM build AS test

WORKDIR /app

COPY . .

RUN chmod -R u+x scripts

RUN npm run build


# dev adds an additional dependencies needed for container management
# in our dev environment
FROM test AS dev
RUN apk add netcat-openbsd

WORKDIR /app


# release builds from a lighter node image and copies stuff over
# from tested build
FROM test AS release

ENV TZ UTC

WORKDIR /app

COPY --from=test /app/node_modules /app/build ./