const { Listr } = require('listr2');

function configureTenderdashTaskFactory(
  tenderdashInitTask,
  renderServiceTemplates,
  writeServiceConfigs,
  resolveDockerHostIp,
) {
  function configureTenderdashTask(configGroup) {
    return new Listr([
      {
        task: async (ctx) => {
          if (!ctx.hostDockerInternalIp) {
            ctx.hostDockerInternalIp = await resolveDockerHostIp();
          }

          const masternodeConfigs = configGroup.filter((config) => config.get('core.masternode.enable'));

          const subTasks = masternodeConfigs.map((config) => ({
            title: `Initialize ${config.getName()} Tenderdash`,
            task: () => tenderdashInitTask(config),
          }));

          // Interconnect Tenderdash nodes
          subTasks.push({
            task: () => {
              const validators = masternodeConfigs.map((config) => {
                const validatorKey = config.get('platform.drive.tenderdash.validatorKey');

                return {
                  address: validatorKey.address,
                  pub_key: validatorKey.pub_key,
                  power: '1',
                  name: config.getName(),
                };
              });

              const randomChainIdPart = Math.floor(Math.random() * 60) + 1;
              const chainId = `dash_masternode_local_${randomChainIdPart}`;

              const genesisTime = masternodeConfigs[0].get('platform.drive.tenderdash.genesis.genesis_time');

              masternodeConfigs.forEach((config, index) => {
                config.set('platform.drive.tenderdash.genesis.genesis_time', genesisTime);
                config.set('platform.drive.tenderdash.genesis.chain_id', chainId);

                const p2pPeers = masternodeConfigs.map((innerConfig, i) => {
                  if (index === i) {
                    return null;
                  }

                  const nodeId = innerConfig.get('platform.drive.tenderdash.nodeId');

                  return {
                    id: nodeId,
                    host: ctx.hostDockerInternalIp,
                    port: 26656 + (i * 100),
                  };
                }).filter((p2pPeer) => p2pPeer !== null);

                config.set('platform.drive.tenderdash.p2p.persistentPeers', p2pPeers);
                config.set('platform.drive.tenderdash.genesis.validators', validators);

                const configFiles = renderServiceTemplates(config);
                writeServiceConfigs(config.getName(), configFiles);
              });
            },
          });

          return new Listr(subTasks);
        },
      },
    ]);
  }

  return configureTenderdashTask;
}

module.exports = configureTenderdashTaskFactory;
