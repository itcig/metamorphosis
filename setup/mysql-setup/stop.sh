#!/usr/bin/env sh
BASEDIR=$(git rev-parse --show-toplevel)
docker-compose --file ${BASEDIR}/setup/mysql-setup/docker-compose.yml down
