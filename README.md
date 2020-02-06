# Metamorphosis

A super dope, pluggable NodeJS Kafka Framework for building Kafka workers like consumers, producers and stream processors.

## Requirements

-   Kafka cluster either BYO or run the install scripts below for a test cluster
-   Node 12.x
-   Yarn or NPM package managers (this project defaults to Yarn)
-   Docker (if testing without Kafka cluster)
-   Docker Compose

## Install

```
yarn install
```

## Config

Copy example `.env` and replace values with your own

```
cp .env.example .env
```

| Option               | Description                                                                  | Default                      |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| KAFKA_BROKERS        | Comma-delimited string of brokers e.g. `10.10.10.1:9092,10.10.10.2:9092,...` | localhost:9092               |
| KAFKA_CLIENT_ID      | Unique ID used by consumers and producers in this app                        | metamorphosis                |
| KAFKA_TOPIC_CONSUMER | Topic to read from for a single-topic consumer app                           | metamorphosis.test           |
| KAFKA_TOPIC_PRODUCER | Topic to write to for a single-topic producer app                            | metamorphosis.test           |
| CONSUMER_GROUP_ID    | Group name responsible for tracking offsets on a consumer                    | metamorphosis-consumer-group |

# Usage

See `/examples` folder for specific sample applications

# Testing

**Install either the `Kitchen Sink` package or pick and choose from the items below.**

## A) Kitchen Sink

Install everything needed to test Kafka and all database adapters

```sh
yarn setup:all
```

## B) Choose your components

You can use Kafka or database environments you are already running by setting them in the `.env` or the `config/{environment}.js` file

### Kafka Cluster

Setup local Kafka cluster with Zookeper and SSL/SASL connection

```sh
yarn kafka:start
```

### MySQL Database

Setup MySQL 8 database with sample schema and table

```sh
yarn mysql:start
```

## Run Mocha Tests

Run all tests from root of project. You can adjust the timeout and other settings in `.mocharc.json` and `test/config.js` as well as the standard application config.

```sh
yarn test
```
