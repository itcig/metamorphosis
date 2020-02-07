#!/usr/bin/env sh
BASEDIR=$(git rev-parse --show-toplevel)
docker-compose --file ${BASEDIR}/setup/kafka-setup/docker-compose.yml down
