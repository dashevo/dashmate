# MN Bootstrap

### Pre-requisites to be Installed

* [docker](https://docs.docker.com/engine/installation/) (version 18.06.0+)
* docker-compose (`pip install -U docker-compose`)

### Setup

Clone this repo & cd to the directory:

```
git clone git@github.com:dashevo/mn-bootstrap.git ./mn-bootstrap
cd mn-bootstrap
```
### Using mn-bootstrap.sh for regtest

mn-bootstrap provides a wrapper around docker-compose to make using different networks
and presets easier. It is called this way:

```bash
$ docker-compose --env-file=.env.local up
```

### Connecting mn-bootstrap to evonet

To connect mn-bootstrap to an existing evonet, you'll have to do some preparations first. You'll have
to edit `.env.evonet`, and fill MASTERNODE_BLS_PRIV_KEY and EXTERNAL_IP.

```bash
$ docker-compose --env-file=.env.evonet up
```
