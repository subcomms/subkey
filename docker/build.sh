#!/usr/bin/env bash

export TARGET_ENV=${1-'dev'}          # dev/test/prod
export CRYPTO_PLATFORM=${2-'stacks'}  # stacks/ethereum

docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up --build
