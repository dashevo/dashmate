const wait = require('../util/wait');

async function waitForCoreSync(coreService) {
  let isSynced = false;

  do {
    ({ result: { IsSynced: isSynced } } = await coreService.getRpcClient().mnsync('status'));

    if (!isSynced) {
      await wait(10000);
    }
  } while (!isSynced);
}

module.exports = waitForCoreSync;
