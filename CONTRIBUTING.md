# Contributing Guidelines

## Introduction

Contributions are always welcomed. You can help `metamorphosis` in the following ways:

-   Documentation
-   Adding tests or improving existing ones
-   Improving benchmarks
-   Bug Fixes
-   TODO from source
-   Performance improvements
-   Add Features

## Security Issues

Please contact project maintainers privately before opening a security issue on Github. It will allow us to fix the issue before attackers know about it.

## New Features

Its better to discuss an API before actually start implementing it. You can open an issue on Github to discuss.

## Development

We assume you already have these tools installed on your system

-   Kafka (or Docker to install local Kafka)
-   Node.JS
-   [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)

As `metamorphosis` is purely JS based you can develop it on Linux, Mac or Windows. Please follow these steps

```sh
# clone metamorphosis
git clone https://github.com/itcig/metamorphosis.git

cd /path/to/metamorphosis

# install node modules
npm run install
```

### Running Tests

Running tests requires Kafka cluster.

If you do not have a Kafka cluster, install one locally using Docker setup

```sh
# assuming MySQL have a user root with no password
npm run kafka:start
```

```sh
# assuming MySQL have a user metamorphosis with no password
npm run mysql:start
```

Once you have a Kafka cluster and MySQL running

```sh
# Set local .env values for
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=client-id-name
KAFKA_TOPIC_CONSUMER=test
KAFKA_TOPIC_PRODUCER=test
CONSUMER_GROUP_ID=consumer-group-name
```

Verify your setup

```sh
# Run the full test suite and linting
npm run test
```
