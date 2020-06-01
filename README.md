# MN Bootstrap

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Distribution package for Dash Masternode installation

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Start node](#start-node)
  - [Stop node](#stop-node)
  - [Register masternode](#register-masternode)
  - [Reset data](#reset-data)
- [Contributing](#contributing)
- [License](#license)

## Install

### Dependencies

* [Docker](https://docs.docker.com/engine/installation/) (v18.06.0+)
* [Docker Compose](https://docs.docker.com/compose/install/) (v1.25.0+)
* [Node.js](https://nodejs.org/en/download/) (v10.0+)

### Distribution package 

```bash
$ git clone -b master https://github.com/dashevo/mn-bootstrap.git
$ cd mn-bootstrap
$ npm install # optional: install CLI dependencies
$ sudo npm link # optional: link CLI for system-wide execution
```

## Usage

The package contains a CLI, Docker Compose files and configuration presets.

### Configuration presets

 - Local - standalone masternode for local development
 - Evonet - masternode with Evonet configuration
 - Testnet - masternode with testnet configuration

### CLI

The CLI can be used to perform routine tasks. Invoke the CLI with `mn` if linked during installation, or with `node bin/mn` if not linked. To list available commands, either run `mn` with no parameters or execute `mn help`. To list the help on any command just execute the command, followed by the `--help` option

### Start node

The `start` command is used to start a node with a specified configuration preset.

```
USAGE
  $ mn start PRESET EXTERNAL-IP CORE-P2P-PORT
ARGUMENTS
  PRESET         (local|testnet|evonet) preset to use
  EXTERNAL-IP    masternode external IP
  CORE-P2P-PORT  Core P2P port
OPTIONS
  -f, --full-node                                  start as full node
  -p, --operator-private-key=operator-private-key  operator private key
```

To start a masternode for Evonet:

```bash
$ mn start evonet 1.2.3.4 20001 -p 2058cd87116ee8492ae0db5d4f8050218588701636197cfcd124dcae8986d514
```

To start a full node for Evonet:

```bash
$ mn start evonet 1.2.3.4 19999 -f
```

### Stop node

The `stop` command is used to stop a running node.

```
USAGE
  $ mn stop PRESET
ARGUMENTS
  PRESET  (local|testnet|evonet) preset to use
```

To stop an Evonet node:

```bash
$ mn stop evonet
```

### Register masternode

#### Funding collateral

#### Masternode registration

The `register` command takes a private key to a Dash address with balance and uses it to create a collateral funding transaction, generate the necessary keys and create a masternode registration transaction on the specified network. It does not configure or start a masternode on the host.

```
USAGE
  $ mn register PRESET FUNDING-PRIVATE-KEY EXTERNAL-IP PORT
ARGUMENTS
  PRESET               (local|testnet|evonet) preset to use
  FUNDING-PRIVATE-KEY  private key with more than 1000 dash for funding collateral
  EXTERNAL-IP          masternode external IP
  PORT                 masternode P2P port
```

To register a testnet masternode:

```bash
$ mn register testnet cVdEfkXLHqftgXzRYZW4EdwtcnJ8Mktw9L4vcEcqbVDs3e2qdzCf 1.2.3.4 19999
```

#### Reset data

The `reset` command removes all data corresponding to the specified preset and allows you to start a node from scratch.

```
USAGE
  $ mn reset PRESET
ARGUMENTS
  PRESET  (local|testnet|evonet) preset to use
```

To reset an Evonet node:

```bash
$ mn reset evonet
```

### Docker Compose

In case if you need to use Docker Compose directly you need to pass a preset configuration.

There are two ways to pass a preset:
 1. Rename corresponding dotenv file (i.e. `.env.evonet`) to `.env`
 2. Add `--env-file` option to `docker-compose` command (i.e. `docker-compose --env-file=.env.evonet ps`)

## Contributing

Feel free to dive in! [Open an issue](https://github.com/dashevo/mn-bootstrap/issues/new) or submit PRs.

## License

[MIT](LICENSE) &copy; Dash Core Group, Inc.
