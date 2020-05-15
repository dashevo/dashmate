# MN Bootstrap

> Distribution package for Dash Masternode installation

## Table of Contents

- [Pre-requisites](#Pre-requisites)
- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Pre-requisites

* [Docker](https://docs.docker.com/engine/installation/)
* [Docker compose](https://docs.docker.com/compose/install/) (v1.25.0+)

## Install

Download and unzip [package](https://github.com/dashevo/mn-bootstrap/archive/master.zip).

## Usage

Package contains Docker Compose file and configuration presets.

### Configure

Package contains several configuration presets:
 - Local - standalone masternode for local development
 - Evonet - masternode with Evonet configuration
 - Testnet - masternode with testnet configuration

There are two ways to apply a preset:
 1. Rename corresponding dotenv file (i.e. `.env.local`) to `.env`
 2. Add `--env-file` option to `docker-compose` command

Edit your chosen preset file to specify configuration variables before starting the masternode.

### Start

In order to run a masternode use Docker Compose:

```bash
$ docker-compose up
```

### CLI

A CLI is available to perform routine tasks. It can be invoked in two ways:
 1. From the repository folder with `node bin/mn`
 2. By creating a global link with `sudo npm link`, then invoking with `mn`

To list available commands, either run `mn` with no parameters or execute `mn help`. To list the help on any command just execute the command, followed by the `--help` option.

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

## Contributing

Feel free to dive in! [Open an issue](https://github.com/dashevo/mn-bootstrap/issues/new) or submit PRs.

## License

[MIT](LICENSE) &copy; Dash Core Group, Inc.
