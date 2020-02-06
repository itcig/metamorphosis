## Local Kafka PLAINTEXT/SSL/SSL_SASL Dev Setup

### Setup copied from [nodesinek](https://github.com/nodefluent/node-sinek)

This library wraps nodesinek heavily so we rely on the same setup scripts.

### Requirements

-   Docker
-   Docker Compose
-   JDK (for keytool, `sudo apt install openjdk-8-jdk`)

### Usage

> Run commands from project root

-   Start kafka: `npm run kafka:start`
-   Stop kafka: `npm run kafka:stop`
-   Show kafka logs: `npm run kafka:logs`
-   Produce to **test** topic with SSL_SASL: `npm run kafka:console produce`
-   Consume from **test** topic with SSL_SASL: `npm run kafka:console consume`
