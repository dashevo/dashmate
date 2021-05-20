#COLLATERAL_KEY=
#COLLATERAL_ADDRESS=

# PLEASE PUT YOUR FAUCET KEY HERE
FAUCET_PRIVATE_KEY=
FAUCET_ADDRESS=
MINING_INTERVAL_IN_SECONDS=30

# PLEASE SET THIS VARIABLES TO YOUR LOCAL DIRECTORIES WITH THE CODE IF YOU WISH TO COMPILE DAPI AND DRIVE
DAPI_REPO_PATH=/dash/dapi
DRIVE_REPO_PATH=/dash/drive

BUILD_DAPI_BEFORE_SETUP=false
BUILD_DAPI_AFTER_SETUP=false
BUILD_DRIVE=false

CONFIG_NAME="local"

MASTERNODES_COUNT=3

echo "Removing all docker containers and volumes..."
docker rm -f -v $(docker ps -a -q); docker volume prune -f; rm -rf ~/.dashmate/

./bin/dashmate config:set --config=${CONFIG_NAME} core.debug 1

if [ $BUILD_DRIVE == true ]
then
  echo "Setting drive build directory"
  ./bin/dashmate config:set --config=${CONFIG_NAME} platform.drive.abci.docker.build.path $DRIVE_REPO_PATH
fi

if [ $BUILD_DAPI_BEFORE_SETUP == true ]
then
  echo "Setting dapi build directory before the setup"
  ./bin/dashmate config:set --config=${CONFIG_NAME} platform.dapi.api.docker.build.path $DAPI_REPO_PATH
fi

./bin/dashmate setup ${CONFIG_NAME} -v --node-count=${MASTERNODES_COUNT}

echo "Setting development environment"
./bin/dashmate config:set --config=${CONFIG_NAME} environment development
echo "Setting log levels to trace"
./bin/dashmate config:set --config=${CONFIG_NAME} platform.drive.abci.log.stdout.level trace

# Set up a miner for tests
echo "Enabling miner in config with an interval of ${MINING_INTERVAL_IN_SECONDS} seconds"
./bin/dashmate config:set --config=${CONFIG_NAME}_seed core.miner.enable true
./bin/dashmate config:set --config=${CONFIG_NAME}_seed core.miner.interval "${MINING_INTERVAL_IN_SECONDS}s"
  for (( NODE_INDEX=1; NODE_INDEX<=MASTERNODES_COUNT; NODE_INDEX++ ))
  do
      ./bin/dashmate config:set --config=${CONFIG_NAME}_${NODE_INDEX} core.miner.interval "${MINING_INTERVAL_IN_SECONDS}s"
  done
./bin/dashmate config:set --config=${CONFIG_NAME}_seed core.miner.address $FAUCET_ADDRESS

echo "Sending 1000 tDash to the ${FAUCET_ADDRESS} for tests"
./bin/dashmate wallet:mint 1000 --config=${CONFIG_NAME}_1 --address=${FAUCET_ADDRESS}

if [ $BUILD_DAPI_AFTER_SETUP == true ]
then
  echo "Setting dapi build directory after the setup"
  for (( NODE_INDEX=1; NODE_INDEX<=MASTERNODES_COUNT; NODE_INDEX++ ))
  do
      ./bin/dashmate config:set --config=${CONFIG_NAME}_${NODE_INDEX} platform.dapi.api.docker.build.path $DAPI_REPO_PATH
  done
fi

./bin/dashmate group:start

echo "Funding key is ${FAUCET_PRIVATE_KEY}"
