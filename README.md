# MN Bootstrap

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

Distribution package for Dash Masternode installation

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Install

### Dependencies

* [Docker](https://docs.docker.com/engine/installation/) (v18.06.0+)
* [Docker Compose](https://docs.docker.com/compose/install/) (v1.25.0+)
* [Node.js](https://nodejs.org/en/download/) (v8.6+, optional for CLI)

Clone the repository and install dependencies if CLI functionality is desired.

```bash
$ git clone -b master https://github.com/dashevo/mn-bootstrap.git
$ cd mn-bootstrap
$ npm install # optional: install CLI dependencies
$ sudo npm link # optional: link CLI for system-wide execution
```

## Usage

Package contains a CLI, Docker Compose files and configuration presets.

### CLI

The CLI can be used to perform routine tasks. Invoke the CLI with `mn` if linked during installation, or with `node bin/mn` if not linked. To list available commands, either run `mn` with no parameters or execute `mn help`. To list the help on any command just execute the command, followed by the `--help` option.

```
USAGE
  $ mn [COMMAND] [ARGS]

COMMANDS
  help      display help for mn
  register  Register masternode
  reset     Reset masternode data
  start     Start masternode
  status    Show masternode status
  stop      Stop masternode
  wallet    Wallet related commands

PRESETS
  local     Local regtest
  evonet    Evonet public testnet
  testnet   Dash testnet
```

#### Start command

The `start` command is used to start a node with a specified configuration.

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

To start a masternode for evonet:

```bash
$ mn start evonet 1.2.3.4 20001 -p 2058cd87116ee8492ae0db5d4f8050218588701636197cfcd124dcae8986d514
```

To start a full node for testnet:

```bash
$ mn start testnet 1.2.3.4 19999 -f
```

#### Stop command

The `stop` command is used to stop a running node.

```
USAGE
  $ mn stop PRESET
ARGUMENTS
  PRESET  (local|testnet|evonet) preset to use
```

To stop a node with evonet configuration:

```bash
$ mn stop evonet
```

#### Register command

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

#### Reset command

The `reset` command removes all Docker containers and volumes associated with a masternode, allowing you to start again fresh.

```
USAGE
  $ mn reset PRESET
ARGUMENTS
  PRESET  (local|testnet|evonet) preset to use
```

To reset an evonet masternode:

```bash
$ mn reset evonet
```

### Docker Compose

You can also use Docker Compose to run the services directly. The package contains several configuration presets:
 - Local - standalone masternode for local development
 - Evonet - masternode with Evonet configuration
 - Testnet - masternode with testnet configuration

There are two ways to apply a preset:
 1. Rename corresponding dotenv file (i.e. `.env.local`) to `.env`
 2. Add `--env-file` option to `docker-compose` command

Edit your chosen preset file to specify configuration variables before starting the masternode. Then use Docker Compose to run the masternode services:

```bash
$ docker-compose up
```

Stop the masternode services:

```bash
$ docker-compose down
```

## Contributing

Feel free to dive in! [Open an issue](https://github.com/dashevo/mn-bootstrap/issues/new) or submit PRs.

## License

[MIT](LICENSE) &copy; Dash Core Group, Inc.
