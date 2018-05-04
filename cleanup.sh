#!/usr/bin/env bash
NETWORK=$1
shift 1

./mn-bootstrap.sh regtest down &&
./mn-bootstrap.sh $NETWORK rm -fv &&

sudo su <<HERE
rm -rf ./data/core-regtestsudo
HERE