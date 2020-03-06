# MN Bootstrap

> Distribution package for easy Dash Evonet masternode installation

## Table of Contents

- [Pre-requisites](#Pre-requisites)
- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Pre-requisites to be Installed

* [docker](https://docs.docker.com/engine/installation/) (version 18.06.0+)
* [docker-compose](https://docs.docker.com/compose/install/)

## Install

Download, unzip & cd to the directory:

```
curl -LOk  https://github.com/dashevo/mn-bootstrap/archive/master.zip
unzip master.zip
rm master.zip
cd mn-bootstrap-master
```
## Usage

1. regtest

mn-bootstrap provides a wrapper around docker-compose to make using different networks
and presets easier. It is called this way:

```bash
$ docker-compose --env-file=.env.local up
```

Or copy .env.local to .env and use docker-compose without additional parameters:

```bash
$ cp .env.local .env
$ docker-compose up
```

2. evonet

To connect mn-bootstrap to an existing evonet, you'll have to do some preparations first. You'll have
to edit `.env.evonet`, and fill CORE_MASTERNODE_BLS_PRIV_KEY and CORE_EXTERNAL_IP.

```bash
$ docker-compose --env-file=.env.evonet up
```

Or copy .env.local to .env and use docker-compose without additional parameters:

```bash
$ cp .env.evonet .env
$ docker-compose up
```

## Contributing

Feel free to dive in! [Open an issue](https://github.com/dashevo/mn-bootstrap/issues/new) or submit PRs.

## License

[MIT](LICENSE) &copy; Dash Core Group, Inc.
