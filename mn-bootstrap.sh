#!/usr/bin/env bash

# This is a wrapper around docker-compose that sets up the environment for the desired network

NETWORK=$1
if [[ -z "$NETWORK" || ! -f networks/$NETWORK.env ]]; then
  echo "Please specify network name as first argument"
  exit 1
fi
shift 1

source networks/$NETWORK.env

docker-compose "$@"
