# [0.19.0](https://github.com/dashevo/mn-bootstrap/compare/v0.18.2...v0.19.0) (2021-05-06)


### Features

* implement feature-flag command ([#336](https://github.com/dashevo/mn-bootstrap/issues/336))
* ChainLock Asset Lock Proofs ([#333](https://github.com/dashevo/mn-bootstrap/issues/333)) ([511c45f](https://github.com/dashevo/mn-bootstrap/commit/511c45f84276b699bed269ec9e2467300b0db079))
* enable `verifyLLMQSignaturesWithCore` flag ([#334](https://github.com/dashevo/mn-bootstrap/issues/334)) ([d1ef767](https://github.com/dashevo/mn-bootstrap/commit/d1ef767289276bd00fd6a925a345ed3356c35f3a))
* feature flags ([#329](https://github.com/dashevo/mn-bootstrap/issues/329)) ([ce592d6](https://github.com/dashevo/mn-bootstrap/commit/ce592d6ee17ac3e720d2bfba4acbaac5dcb946f6))
* update DAPI to 0.19 ([#330](https://github.com/dashevo/mn-bootstrap/issues/330)) ([23e4c6f](https://github.com/dashevo/mn-bootstrap/commit/23e4c6f83557e30d44eaab70706c8ab807d94deb))
* display tasks elapsed time in verbose mode ([#320](https://github.com/dashevo/mn-bootstrap/issues/320)) ([ddc76d3](https://github.com/dashevo/mn-bootstrap/commit/ddc76d3850de1e201cda59861b98035afefd2852))
* NPM cache for DAPI and Drive builds ([#302](https://github.com/dashevo/mn-bootstrap/issues/302)) ([f346c2a](https://github.com/dashevo/mn-bootstrap/commit/f346c2a9a35ea6a37861a6f6cf1b979dfe153990))
* tenderdash empty blocks configuration ([#315](https://github.com/dashevo/mn-bootstrap/issues/315)) ([1270143](https://github.com/dashevo/mn-bootstrap/commit/12701438c933859fbfb33d13fe1549ffa4bee965))
* check docker version ([#310](https://github.com/dashevo/mn-bootstrap/issues/310)) ([f7092b1](https://github.com/dashevo/mn-bootstrap/commit/f7092b121de30750b5981bfe94f76271820c3cba))
* skip Instant Lock verification in SDK ([#299](https://github.com/dashevo/mn-bootstrap/issues/299)) ([922da35](https://github.com/dashevo/mn-bootstrap/commit/922da35de700e7de670950d2167350f98038c8df))
* update drive to 0.19-dev ([#303](https://github.com/dashevo/mn-bootstrap/issues/303)) ([39d8f92](https://github.com/dashevo/mn-bootstrap/commit/39d8f9206c75148830bee018216ccf264285a814))
* register masternodes on testnet given funding privkey ([#288](https://github.com/dashevo/mn-bootstrap/issues/288)) ([6992cb7](https://github.com/dashevo/mn-bootstrap/commit/6992cb7260861fe8d7a35c38d018b4d1226a91f3))
* wait for node to be ready option ([#295](https://github.com/dashevo/mn-bootstrap/issues/295)) ([4291afa](https://github.com/dashevo/mn-bootstrap/commit/4291afa498d7fe98e97afc1cc952b7dae91868d8))
* wait for tenderdash on start ([#289](https://github.com/dashevo/mn-bootstrap/issues/289)) ([efe0f95](https://github.com/dashevo/mn-bootstrap/commit/efe0f950c05230d11fdda33fdf306df3884d813b))
* activate sporks during local setup ([#286](https://github.com/dashevo/mn-bootstrap/issues/286)) ([acadfa2](https://github.com/dashevo/mn-bootstrap/commit/acadfa288b7ec4a4b63e8861621238ee5553d4c9))


### Bug Fixes

* config with name 'devnet' is not present ([#337](https://github.com/dashevo/mn-bootstrap/issues/337))
* wait for masternodes to be synced before start miner ([#343](https://github.com/dashevo/mn-bootstrap/issues/343))
*  cannot read property 'toString' of undefined ([#338](https://github.com/dashevo/mn-bootstrap/issues/338))
* with docker compose 1.29 container.inspect throws error if the container isn't running ([#325](https://github.com/dashevo/mn-bootstrap/issues/325))
* BlsSignatures is not a function ([#318](https://github.com/dashevo/mn-bootstrap/issues/318)) ([b7bed04](https://github.com/dashevo/mn-bootstrap/commit/b7bed04ac27a7e45e27012248c73cca6a7dcf7c5))
* drive network is always set to "testnet" ([#321](https://github.com/dashevo/mn-bootstrap/issues/321)) ([ca00f04](https://github.com/dashevo/mn-bootstrap/commit/ca00f04db8e692718321d3cf35647b8d40e17cd0))
* cannot register testnet mn ([#313](https://github.com/dashevo/mn-bootstrap/issues/313)) ([bc1dc12](https://github.com/dashevo/mn-bootstrap/commit/bc1dc12a5d5f17db0a766429fa84fca68a31a5e5))
* grammar in some error messages ([#309](https://github.com/dashevo/mn-bootstrap/issues/309)) ([faeb1b2](https://github.com/dashevo/mn-bootstrap/commit/faeb1b25ddb39c7eae279bf122d777d2004be339))
* grammar in task titles  ([#314](https://github.com/dashevo/mn-bootstrap/issues/314)) ([f56f025](https://github.com/dashevo/mn-bootstrap/commit/f56f025e8ac06e7ea579b0866190c13a461767b3))
* setup local network doesn't work sometimes ([#311](https://github.com/dashevo/mn-bootstrap/issues/311)) ([1d2a8f7](https://github.com/dashevo/mn-bootstrap/commit/1d2a8f73a7e35747668988863db0a0202fb4d4a2))
* invalid order of operations lead to Drive to never start ([#307](https://github.com/dashevo/mn-bootstrap/issues/307)) ([0aa761b](https://github.com/dashevo/mn-bootstrap/commit/0aa761bec199fcb093d674a854acd4c408c5d798))
* waitForNodeTobeReady tasks were constructed in a wrong way ([#300](https://github.com/dashevo/mn-bootstrap/issues/300)) ([b2273bd](https://github.com/dashevo/mn-bootstrap/commit/b2273bd58fa3c3253dbacd66cbb57f934aa20638))
* invalid if condition were used to determine local seed config ([#298](https://github.com/dashevo/mn-bootstrap/issues/298)) ([f762e25](https://github.com/dashevo/mn-bootstrap/commit/f762e25ca6a9dce4aebce1a7c233cdb95b93bf86))
* progressCallback not found ([#296](https://github.com/dashevo/mn-bootstrap/issues/296)) ([1948f70](https://github.com/dashevo/mn-bootstrap/commit/1948f7067ed71920e3f4ece74fb80afd21ce26ca))
* commands do not work on windows ([#291](https://github.com/dashevo/mn-bootstrap/issues/291)) ([f69b0e7](https://github.com/dashevo/mn-bootstrap/commit/f69b0e75097119a4b78a49076d376a844406ed28))
* make services stop in a reverse order to avoid nodes getting banned ([#292](https://github.com/dashevo/mn-bootstrap/issues/292)) ([cef7b72](https://github.com/dashevo/mn-bootstrap/commit/cef7b72bb41305b35013d123dcd560906f2e18c5))
* grouped configs are not allowed to use ([#282](https://github.com/dashevo/mn-bootstrap/issues/282)) ([b968b63](https://github.com/dashevo/mn-bootstrap/commit/b968b630600586630268d45d74a71fa624f6098b))


### Reverts

* fix BlsSignatures is not a function ([#319](https://github.com/dashevo/mn-bootstrap/issues/319)) ([5710ed5](https://github.com/dashevo/mn-bootstrap/commit/5710ed59a4ae24ce6e2f262a73639b7d3105b58f))



## [0.18.2](https://github.com/dashevo/mn-bootstrap/compare/v0.18.1...v0.18.2) (2021-04-14)


### Features

* update to core 0.17.0.0-rc4 ([#326](https://github.com/dashevo/mn-bootstrap/issues/326))



## [0.18.1](https://github.com/dashevo/mn-bootstrap/compare/v0.18.0...v0.18.1) (2021-03-09)


### Features

* update Drive and DAPI images ([0273d33](https://github.com/dashevo/mn-bootstrap/commit/0273d33d524bd6dfa7facdd708fe79d4a2e83328))



# [0.18.0](https://github.com/dashevo/mn-bootstrap/compare/v0.17.4...v0.18.0) (2021-03-03)


### Bug Fixes

* platform sync shows Infinity% ([#281](https://github.com/dashevo/mn-bootstrap/issues/281))
* status command returns TypeError ([#251](https://github.com/dashevo/mn-bootstrap/issues/251))
* uncaught errors when remote services down ([#241](https://github.com/dashevo/mn-bootstrap/issues/241))


### Features

* enable `llmq-qvved-sync` on testnet ([#267](https://github.com/dashevo/mn-bootstrap/issues/267))
* include sentinel image version in config ([#265](https://github.com/dashevo/mn-bootstrap/issues/265))
* update dashd to `0.17.0.0-rc3-hotfix1` ([#276](https://github.com/dashevo/mn-bootstrap/issues/276))
* hard and soft resets, `--platform-only` option ([#249](https://github.com/dashevo/mn-bootstrap/issues/249), [#258](https://github.com/dashevo/mn-bootstrap/issues/258), [#272](https://github.com/dashevo/mn-bootstrap/issues/272))
* update Tenderdash to 0.34.3 ([#274](https://github.com/dashevo/mn-bootstrap/issues/274))


### Chores

* remove evonet-specific code ([#268](https://github.com/dashevo/mn-bootstrap/issues/274))



## [0.17.4](https://github.com/dashevo/mn-bootstrap/compare/v0.17.3...v0.17.4) (2021-02-03)


### Features

* output Drive logs into files ([#252](https://github.com/dashevo/mn-bootstrap/issues/252))



## [0.17.3](https://github.com/dashevo/mn-bootstrap/compare/v0.17.2...v0.17.3) (2021-01-19)


### Bug Fixes

* DashPay contract is not set for testnet ([#247](https://github.com/dashevo/mn-bootstrap/issues/247))



## [0.17.2](https://github.com/dashevo/mn-bootstrap/compare/v0.17.1...v0.17.2) (2021-01-13)


### Features

* add seed nodes for testnet ([#239](https://github.com/dashevo/mn-bootstrap/issues/239))



## [0.17.1](https://github.com/dashevo/mn-bootstrap/compare/v0.17.0...v0.17.1) (2021-01-12)


### Bug Fixes

* validator state not found after reset ([#238](https://github.com/dashevo/mn-bootstrap/issues/238))



# [0.17.0](https://github.com/dashevo/mn-bootstrap/compare/v0.16.1...v0.17.0) (2021-01-11)


### Features

* add verbose mode to commands ([#187](https://github.com/dashevo/mn-bootstrap/issues/187), [#230](https://github.com/dashevo/mn-bootstrap/issues/230))
* update dependencies [#177](https://github.com/dashevo/mn-bootstrap/issues/177), [#188](https://github.com/dashevo/mn-bootstrap/issues/188), [#211](https://github.com/dashevo/mn-bootstrap/issues/211), ([#231](https://github.com/dashevo/mn-bootstrap/issues/231))
* introduce setup command ([#200](https://github.com/dashevo/mn-bootstrap/issues/200), [#214](https://github.com/dashevo/mn-bootstrap/issues/214), [#219](https://github.com/dashevo/mn-bootstrap/issues/219))
* configure `passFakeAssetLockProofForTests` ([#222](https://github.com/dashevo/mn-bootstrap/issues/222))
* expose `rawchainlocksig` and `zmqpubrawtxlocksig` from Core ([#221](https://github.com/dashevo/mn-bootstrap/issues/221))
* pass dashpay contract id and block height to drive ([#220](https://github.com/dashevo/mn-bootstrap/issues/220))
* add `skipAssetLockConfirmationValidation` option for drive ([#216](https://github.com/dashevo/mn-bootstrap/issues/216))
* config migration ([#199](https://github.com/dashevo/mn-bootstrap/issues/199))
* more status command output ([#124](https://github.com/dashevo/mn-bootstrap/issues/124), [#229](https://github.com/dashevo/mn-bootstrap/issues/229))
* update Insight API ([#206](https://github.com/dashevo/mn-bootstrap/issues/206), [#207](https://github.com/dashevo/mn-bootstrap/issues/207))
* register dashpay contract ([#125](https://github.com/dashevo/mn-bootstrap/issues/125))
* implement rate limiter in config ([#183](https://github.com/dashevo/mn-bootstrap/issues/183))
* update envoy for multi-arch support ([#179](https://github.com/dashevo/mn-bootstrap/issues/179))
* add network parameters to configs ([#150](https://github.com/dashevo/mn-bootstrap/issues/150))
* add ZMQ envs for Drive ([#180](https://github.com/dashevo/mn-bootstrap/issues/180))
* update testnet config ([#232](https://github.com/dashevo/mn-bootstrap/issues/232))


### Bug Fixes

* pass correct params to error message ([#228](https://github.com/dashevo/mn-bootstrap/issues/228))
* rmdir and tenderdash errors ([#227](https://github.com/dashevo/mn-bootstrap/issues/227))
* configs are removed during writing ([#224](https://github.com/dashevo/mn-bootstrap/issues/224))
* platform init doesn't work with many faulty nodes ([#217](https://github.com/dashevo/mn-bootstrap/issues/217))
* syntax error in nginx config ([#205](https://github.com/dashevo/mn-bootstrap/issues/205))
* templates dir not found in travis ([#201](https://github.com/dashevo/mn-bootstrap/issues/201), [#203](https://github.com/dashevo/mn-bootstrap/issues/203))
* a bunch of small fixes ([#194](https://github.com/dashevo/mn-bootstrap/issues/194))
* lint errors and dash core config ([#192](https://github.com/dashevo/mn-bootstrap/issues/192))
* add section to dashd testnet config ([#175](https://github.com/dashevo/mn-bootstrap/issues/175))



## [0.16.1](https://github.com/dashevo/mn-bootstrap/compare/v0.16.0...v0.16.1) (2020-10-30)


### Bug Fixes

* add section to dashd testnet config ([#175](https://github.com/dashevo/mn-bootstrap/issues/175))



# [0.16.0](https://github.com/dashevo/mn-bootstrap/compare/v0.15.1...v0.16.0) (2020-10-29)


### Bug Fixes

* "No available addresses" in setup command on the platform init step ([#164](https://github.com/dashevo/mn-bootstrap/issues/164))


### Features

* make `NODE_ENV` and logging level configurable ([#172](https://github.com/dashevo/mn-bootstrap/issues/172))
* obtain and pass DPNS contract block height ([#170](https://github.com/dashevo/mn-bootstrap/issues/170), [#173](https://github.com/dashevo/mn-bootstrap/issues/173))
* update to Dash SDK 0.16 ([#160](https://github.com/dashevo/mn-bootstrap/issues/163), [#163](https://github.com/dashevo/mn-bootstrap/issues/163), [#163](https://github.com/dashevo/mn-bootstrap/issues/163), [#166](https://github.com/dashevo/mn-bootstrap/issues/166))
* restart command ([#152](https://github.com/dashevo/mn-bootstrap/issues/152))
* switch insight-api docker image to shumkov/insight-api:3.0.0 ([#157](https://github.com/dashevo/mn-bootstrap/issues/157))
* update Dash Core to 0.16 ([#153](https://github.com/dashevo/mn-bootstrap/issues/153), [#155](https://github.com/dashevo/mn-bootstrap/issues/155))


### Documentation

* cannot mint dash on evonet ([#171](https://github.com/dashevo/mn-bootstrap/issues/171))


### BREAKING CHANGES

* `platform.dpns.contractId` config options is moved to `platform.dpns.contract.id`
* data created with 0.15 version and less in not compatible. Please reset your node before upgrade
* see [Drive breaking changes](https://github.com/dashevo/js-drive/releases/tag/v0.16.0)
* see [DAPI breaking changes](https://github.com/dashevo/dapi/releases/tag/v0.16.0)



## [0.15.1](https://github.com/dashevo/mn-bootstrap/compare/v0.15.0...v0.15.1) (2020-09-08)


### Bug Fixes

* services.core.ports contains an invalid type ([#149](https://github.com/dashevo/mn-bootstrap/issues/149))



# [0.15.0](https://github.com/dashevo/mn-bootstrap/compare/v0.14.0...v0.15.0) (2020-09-04)


### Bug Fixes

* ignored mint address option ([#143](https://github.com/dashevo/mn-bootstrap/issues/143))
* Dash Client was created before Tendermint is started ([#131](https://github.com/dashevo/mn-bootstrap/issues/131))
* gRPC buffer size settings in NGINX was too small ([#127](https://github.com/dashevo/mn-bootstrap/issues/127))
* transaction filter stream doesn't work with gRPC-Web ([#116](https://github.com/dashevo/mn-bootstrap/issues/116))


### Features

* replace env files and presets with new `config` command ([#119](https://github.com/dashevo/mn-bootstrap/issues/119), [#138](https://github.com/dashevo/mn-bootstrap/issues/138))
* remove unnecessary block generation ([#141](https://github.com/dashevo/mn-bootstrap/issues/141))
* block mining with local development ([#137](https://github.com/dashevo/mn-bootstrap/issues/137))
* move container datadirs to named docker volumes ([#123](https://github.com/dashevo/mn-bootstrap/issues/123), [#139](https://github.com/dashevo/mn-bootstrap/issues/139), [#140](https://github.com/dashevo/mn-bootstrap/issues/140), [#142](https://github.com/dashevo/mn-bootstrap/issues/142))
* nginx responds with unimplemented in case of unsupported version ([#134](https://github.com/dashevo/mn-bootstrap/issues/134))
* move `subscribeToTransactionsWithProofs` to `Core` service ([#121](https://github.com/dashevo/mn-bootstrap/issues/121))
* use new DPNS contract ([#117](https://github.com/dashevo/mn-bootstrap/issues/117))
* generate empty blocks every 3 minutes ([#114](https://github.com/dashevo/mn-bootstrap/issues/114))
* use `generateToAddress` instead of `generate` ([#111](https://github.com/dashevo/mn-bootstrap/issues/111))
* add docker image update support to setup-for-local-development ([#113](https://github.com/dashevo/mn-bootstrap/issues/113))


### Code Refactoring

* use MongoDB init script to initiate replica ([#147](https://github.com/dashevo/mn-bootstrap/issues/147))
* remove getUTXO dependency for SDK ([#133](https://github.com/dashevo/mn-bootstrap/issues/139))


### BREAKING CHANGES

* node data from `data` dir is not using anymore and should be removed
* see [Drive breaking changes](https://github.com/dashevo/js-drive/releases/tag/v0.15.0)
* see [DAPI breaking changes](https://github.com/dashevo/dapi/releases/tag/v0.15.0)



# [0.14.0](https://github.com/dashevo/mn-bootstrap/compare/v0.13.4...v0.14.0) (2020-07-24)


### Bug Fixes

* missing `build` section for `tx_filter_stream_service` service ([#94](https://github.com/dashevo/mn-bootstrap/issues/94))
* missing env variables for `dapi-tx-filter-stream` service ([#99](https://github.com/dashevo/mn-bootstrap/issues/99))
* faucet inputs where locked after platform initialization script ([#88](https://github.com/dashevo/mn-bootstrap/issues/88))
* original Tendermint image creates wrong mount points ([#86](https://github.com/dashevo/mn-bootstrap/issues/86))


### Features

* update Evonet preset to 0.14 ([#108](https://github.com/dashevo/mn-bootstrap/issues/108), [#105](https://github.com/dashevo/mn-bootstrap/issues/105))
* update Drive and DAPI versions to 0.14 ([#98](https://github.com/dashevo/mn-bootstrap/issues/98))
* implement `status` command ([#49](https://github.com/dashevo/mn-bootstrap/issues/49), [#93](https://github.com/dashevo/mn-bootstrap/issues/93), [#96](https://github.com/dashevo/mn-bootstrap/issues/96))
* move from Listr to Listr2 ([#84](https://github.com/dashevo/mn-bootstrap/issues/84))
* implement `setup-for-local-development` command ([#82](https://github.com/dashevo/mn-bootstrap/issues/82), [#101](https://github.com/dashevo/mn-bootstrap/issues/101))
* implement `update` option for `start` command ([#80](https://github.com/dashevo/mn-bootstrap/issues/80))
* build docker images from local directories ([#59](https://github.com/dashevo/mn-bootstrap/issues/59), [#66](https://github.com/dashevo/mn-bootstrap/issues/66), [#90](https://github.com/dashevo/mn-bootstrap/issues/90))


### Documentation

* document `status` command in README ([#97](https://github.com/dashevo/mn-bootstrap/issues/97))
* add release date badge ([#85](https://github.com/dashevo/mn-bootstrap/issues/85))
* add development usage for local docker build ([#67](https://github.com/dashevo/mn-bootstrap/issues/67))


### BREAKING CHANGES

* data created with previous versions of Dash Platform is incompatible we the new one, so you need to reset data before you start the node



## [0.13.4](https://github.com/dashevo/mn-bootstrap/compare/v0.13.3...v0.13.4) (2020-06-18)


### Bug Fixes

* tendermint throw fatal error on start in linux environment ([#76](https://github.com/dashevo/mn-bootstrap/issues/76))



## [0.13.3](https://github.com/dashevo/mn-bootstrap/compare/v0.13.2...v0.13.3) (2020-06-18)


### Bug Fixes

* parsing docker container name on first start ([#75](https://github.com/dashevo/mn-bootstrap/issues/75))



## [0.13.2](https://github.com/dashevo/mn-bootstrap/compare/v0.13.1...v0.13.2) (2020-06-16)


### Bug Fixes

* DAPI rate limits disabled for evonet for some reason ([#73](https://github.com/dashevo/mn-bootstrap/issues/73))



## [0.13.1](https://github.com/dashevo/mn-bootstrap/compare/v0.12.6...v0.13.1) (2020-06-12)


### Features

* update Evonet configs ([fd0158a](https://github.com/dashevo/mn-bootstrap/commit/fd0158a45f1c624628fe7a2735124db1c9f20338))



# [0.13.0](https://github.com/dashevo/mn-bootstrap/compare/v0.12.6...v0.13.0) (2020-06-09)


### Bug Fixes

* do not start stopped services on the docker deamon restart ([#55](https://github.com/dashevo/mn-bootstrap/issues/55))
* switch to dashpay org for sentinel ([#62](https://github.com/dashevo/mn-bootstrap/issues/62))


### Features

* start/stop node commands ([#45](https://github.com/dashevo/mn-bootstrap/issues/45), [#48](https://github.com/dashevo/mn-bootstrap/issues/48))
* data reset command ([#43](https://github.com/dashevo/mn-bootstrap/issues/43), [#60](https://github.com/dashevo/mn-bootstrap/issues/60))
* masternode registration commands ([#30](https://github.com/dashevo/mn-bootstrap/issues/30), [#44](https://github.com/dashevo/mn-bootstrap/issues/44), [#54](https://github.com/dashevo/mn-bootstrap/issues/54), [#69](https://github.com/dashevo/mn-bootstrap/issues/69))
* remove sleep from docker compose ([#57](https://github.com/dashevo/mn-bootstrap/issues/57))
* allow to start full node ([#42](https://github.com/dashevo/mn-bootstrap/issues/42))
* update configs and docker images ([#64](https://github.com/dashevo/mn-bootstrap/issues/42))


### Documentation

* update README.md to clarify install instructions ([#33](https://github.com/dashevo/mn-bootstrap/issues/33), [#65](https://github.com/dashevo/mn-bootstrap/issues/65))


### BREAKING CHANGES

* Dash Platform v0.12 data in incompatible with 0.13, so you need to reset data before you start the node



# [0.12.6](https://github.com/dashevo/mn-bootstrap/compare/v0.12.5...v0.12.6) (2020-05-23)


### Features

* update Evonet configs ([#56](https://github.com/dashevo/mn-bootstrap/issues/56))



# [0.12.5](https://github.com/dashevo/mn-bootstrap/compare/v0.12.4...v0.12.5) (2020-05-01)


### Bug Fixes

* use updated sentinel image ([#41](https://github.com/dashevo/mn-bootstrap/issues/41))



# [0.12.4](https://github.com/dashevo/mn-bootstrap/compare/v0.12.3...v0.12.4) (2020-04-30)


### Bug Fixes

* MongoDB replica set doesn't work sometimes ([#40](https://github.com/dashevo/mn-bootstrap/issues/40)) ([a5e31cd](https://github.com/dashevo/mn-bootstrap/commit/a5e31cd341bfd3e18240e3ee4c8f5dfeebfd249c))



# [0.12.3](https://github.com/dashevo/mn-bootstrap/compare/v0.12.2...v0.12.3) (2020-04-28)


### Bug Fixes

* outdated genesis config for Tendermint ([#37](https://github.com/dashevo/mn-bootstrap/issues/37))
* outdated persistent node IDs in Tendermint config ([#38](https://github.com/dashevo/mn-bootstrap/issues/38))



## [0.12.2](https://github.com/dashevo/mn-bootstrap/compare/v0.12.1...v0.12.2) (2020-04-22)


### Bug Fixes

* update DPNS identities for evonet ([#31](https://github.com/dashevo/mn-bootstrap/issues/31))


## [0.12.1](https://github.com/dashevo/mn-bootstrap/compare/v0.11.1...v0.12.0) (2020-04-21)


## Bug Fixes

* `latest` envoy docker image tag is not present anymore ([#29](https://github.com/dashevo/mn-bootstrap/issues/29))


# [0.12.0](https://github.com/dashevo/mn-bootstrap/compare/v0.11.1...v0.12.0) (2020-04-19)


### Bug Fixes

* dash-cli doesn't work without default config ([#18](https://github.com/dashevo/mn-bootstrap/issues/18))
* explicitly load core conf file ([#23](https://github.com/dashevo/mn-bootstrap/issues/23))
* invalid gRPC Web configuration ([#25](https://github.com/dashevo/mn-bootstrap/issues/25), [#26](https://github.com/dashevo/mn-bootstrap/issues/26))
* remove spork private key from сore config ([#11](https://github.com/dashevo/mn-bootstrap/issues/11))


### Code Refactoring

* tidy up services and configs ([#27](https://github.com/dashevo/mn-bootstrap/issues/27))


### Features

* add testnet preset ([#15](https://github.com/dashevo/mn-bootstrap/issues/15))
* update to new Drive ([#21](https://github.com/dashevo/mn-bootstrap/issues/21), [#24](https://github.com/dashevo/mn-bootstrap/issues/24))


### BREAKING CHANGES

* data and config dir paths are changed
* `tendermint` service now called `drive_tendermint`
* `machine` is removed due to merging Machine into Drive
* new version of Drive is incompatible with 0.11 so you need to wipe data before run 0.12:
  * drop `drive_mongodb` and `drive_leveldb` volumes
  * `docker-commpose --env-file=.env.<PRESET> run drive_tendermint unsafe_reset_all`


## 0.11.1 (2020-03-17)


### Bug Fixes

*  update configs for Evonet ([#7](https://github.com/dashevo/mn-bootstrap/issues/7))


# 0.11.0 (2020-03-09)


### Features

* update configurations and docker-compose file for `local` and `evonet` envs ([230ea62](https://github.com/dashevo/mn-bootstrap/commit/230ea62a856b986127eb3b8e52bf7a19a5169818))


### BREAKING CHANGES

* `testnet` and `mainnet` is not supported anymore
