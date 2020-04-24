const {
  createContainer: createAwilixContainer,
  InjectionMode,
  asClass,
  asFunction,
  asValue,
} = require('awilix');

const Docker = require('dockerode');
const dockerCompose = require('docker-compose');

const startCoreFactory = require('./core/startCoreFactory');
const createRpcClient = require('./core/createRpcClient');
const waitForCoreStart = require('./core/waitForCoreStart');
const waitForCoreSync = require('./core/waitForCoreSync');

const createNewAddress = require('./core/wallet/createNewAddress');
const generateToAddressFactory = require('./core/wallet/generateToAddress');

async function createDIContainer() {
  const container = createAwilixContainer({
    injectionMode: InjectionMode.CLASSIC,
  });

  /**
   * Docker
   */
  container.register({
    dockerCompose: asValue(dockerCompose),
    docker: asClass(Docker),
  });

  /**
   * Core
   */
  container.register({
    createRpcClient: asValue(createRpcClient),
    waitForCoreStart: asValue(waitForCoreStart),
    waitForCoreSync: asValue(waitForCoreSync),
    startCore: asFunction(startCoreFactory).singleton(),
  });

  /**
   * Core Wallet
   */
  container.register({
    createNewAddress: asValue(createNewAddress),
    generateToAddress: asValue(generateToAddressFactory),
  });

  return container;
}

module.exports = createDIContainer;
