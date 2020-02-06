#!/usr/bin/env sh
BASEDIR=$(git rev-parse --show-toplevel)
${BASEDIR}/setup/kafka-setup/start.sh
${BASEDIR}/setup/mysql-setup/start.sh
