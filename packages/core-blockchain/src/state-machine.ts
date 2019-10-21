import { app, Container, Contracts, Enums, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Utils } from "@arkecosystem/crypto";

import { Blockchain } from "./blockchain";
import { blockchainMachine } from "./machines/blockchain";

// defer initialisation to "init" due to this being resolved before the container kicks in
let logger;
let emitter;
let database;
let transactionPool;
let stateStorage = {} as any;

/**
 * The blockchain actions.
 * @param  {Blockchain} blockchain
 * @return {Object}
 */
blockchainMachine.actionMap = (blockchain: Blockchain) => ({
    blockchainReady: () => {
        if (!stateStorage.started) {
            stateStorage.started = true;
            emitter.dispatch(Enums.Events.State.StateStarted, true);
        }
    },

    checkLater() {
        if (!blockchain.isStopped && !stateStorage.wakeUpTimeout) {
            blockchain.setWakeUp();
        }
    },

    checkLastBlockSynced() {
        return blockchain.dispatch(blockchain.isSynced() ? "SYNCED" : "NOTSYNCED");
    },

    async checkLastDownloadedBlockSynced() {
        let event = "NOTSYNCED";
        logger.debug(`Queued chunks of blocks (process: ${blockchain.queue.length()})`);

        if (blockchain.queue.length() > 100) {
            event = "PAUSED";
        }

        // tried to download but no luck after 5 tries (looks like network missing blocks)
        if (stateStorage.noBlockCounter > 5 && blockchain.queue.idle()) {
            logger.info("Tried to sync 5 times to different nodes, looks like the network is missing blocks");

            stateStorage.noBlockCounter = 0;
            event = "NETWORKHALTED";

            if (stateStorage.p2pUpdateCounter + 1 > 3) {
                logger.info("Network keeps missing blocks.");

                const networkStatus = await app
                    .get<Contracts.P2P.INetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
                    .checkNetworkHealth();
                if (networkStatus.forked) {
                    stateStorage.numberOfBlocksToRollback = networkStatus.blocksToRollback;
                    event = "FORK";
                }

                stateStorage.p2pUpdateCounter = 0;
            } else {
                stateStorage.p2pUpdateCounter++;
            }
        } else if (stateStorage.lastDownloadedBlock && blockchain.isSynced(stateStorage.lastDownloadedBlock)) {
            stateStorage.noBlockCounter = 0;
            stateStorage.p2pUpdateCounter = 0;

            event = "SYNCED";
        }

        if (stateStorage.networkStart) {
            event = "SYNCED";
        }

        if (process.env.CORE_ENV === "test") {
            event = "TEST";
        }

        blockchain.dispatch(event);
    },

    downloadFinished() {
        logger.info("Block download finished");

        if (stateStorage.networkStart) {
            // next time we will use normal behaviour
            stateStorage.networkStart = false;

            blockchain.dispatch("SYNCFINISHED");
        } else if (blockchain.queue.idle()) {
            blockchain.dispatch("PROCESSFINISHED");
        }
    },

    downloadPaused: () => logger.info("Blockchain download paused"),

    syncingComplete() {
        logger.info("Blockchain 100% in sync");
        blockchain.dispatch("SYNCFINISHED");
    },

    stopped() {
        logger.info("The blockchain has been stopped");
    },

    exitApp() {
        app.terminate("Failed to startup blockchain. Exiting ARK Core!");
    },

    async init() {
        // todo: turn the state machine into a class so that injection can be used
        logger = app.log;
        emitter = app.get<Contracts.Kernel.Events.EventDispatcher>(Container.Identifiers.EventDispatcherService);
        database = app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);
        transactionPool = app.get<Contracts.TransactionPool.Connection>(Container.Identifiers.TransactionPoolService);
        stateStorage = app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore);
        blockchainMachine.state = stateStorage;

        try {
            const block: Interfaces.IBlock = stateStorage.getLastBlock();

            if (!database.restoredDatabaseIntegrity) {
                logger.info("Verifying database integrity");

                if (!(await database.verifyBlockchain())) {
                    return blockchain.dispatch("ROLLBACK");
                }

                logger.info("Verified database integrity");
            } else {
                logger.info("Skipping database integrity check after successful database recovery");
            }

            // only genesis block? special case of first round needs to be dealt with
            if (block.data.height === 1) {
                if (block.data.payloadHash !== Managers.configManager.get("network.nethash")) {
                    logger.error("FATAL: The genesis block payload hash is different from configured the nethash");

                    return blockchain.dispatch("FAILURE");
                }

                await database.deleteRound(1);
            }

            /** *******************************
             *  state machine data init      *
             ******************************* */
            stateStorage.setLastBlock(block);

            // Delete all rounds from the future due to shutdown before processBlocks finished writing the blocks.
            const roundInfo = AppUtils.roundCalculator.calculateRound(block.data.height);
            await database.deleteRound(roundInfo.round + 1);

            if (stateStorage.networkStart) {
                await database.buildWallets();
                await database.restoreCurrentRound(block.data.height);
                await transactionPool.buildWallets();
                await app.get<Contracts.P2P.INetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).start();

                return blockchain.dispatch("STARTED");
            }

            if (process.env.NODE_ENV === "test") {
                logger.notice("TEST SUITE DETECTED! SYNCING WALLETS AND STARTING IMMEDIATELY.");

                await database.buildWallets();
                await app.get<Contracts.P2P.INetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).start();

                return blockchain.dispatch("STARTED");
            }

            logger.info(`Last block in database: ${block.data.height.toLocaleString()}`);

            /** *******************************
             * database init                 *
             ******************************* */
            // Integrity Verification
            await database.buildWallets();

            await database.restoreCurrentRound(block.data.height);
            await transactionPool.buildWallets();

            await app.get<Contracts.P2P.INetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).start();

            return blockchain.dispatch("STARTED");
        } catch (error) {
            logger.error(error.stack);

            return blockchain.dispatch("FAILURE");
        }
    },

    async downloadBlocks() {
        const lastDownloadedBlock: Interfaces.IBlockData =
            stateStorage.lastDownloadedBlock || stateStorage.getLastBlock().data;
        const blocks: Interfaces.IBlockData[] = await app
            .get<Contracts.P2P.INetworkMonitor>(Container.Identifiers.PeerNetworkMonitor)
            .syncWithNetwork(lastDownloadedBlock.height);

        if (blockchain.isStopped) {
            return;
        }

        // Could have changed since entering this function, e.g. due to a rollback.
        if (stateStorage.lastDownloadedBlock && lastDownloadedBlock.id !== stateStorage.lastDownloadedBlock.id) {
            return;
        }

        const empty: boolean = !blocks || blocks.length === 0;
        const chained: boolean =
            !empty && (AppUtils.isBlockChained(lastDownloadedBlock, blocks[0]) || Utils.isException(blocks[0]));

        if (chained) {
            logger.info(
                `Downloaded ${blocks.length} new ${AppUtils.pluralize(
                    "block",
                    blocks.length,
                )} accounting for a total of ${AppUtils.pluralize(
                    "transaction",
                    blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0),
                    true,
                )}`,
            );

            try {
                blockchain.enqueueBlocks(blocks);
                blockchain.dispatch("DOWNLOADED");
            } catch (error) {
                logger.warning(`Failed to enqueue downloaded block.`);

                blockchain.dispatch("NOBLOCK");

                return;
            }
        } else {
            if (empty) {
                logger.info("No new block found on this peer");
            } else {
                logger.warning(`Downloaded block not accepted: ${JSON.stringify(blocks[0])}`);
                logger.warning(`Last downloaded block: ${JSON.stringify(lastDownloadedBlock)}`);

                blockchain.clearQueue();
            }

            if (blockchain.queue.length() === 0) {
                stateStorage.noBlockCounter++;
                stateStorage.lastDownloadedBlock = stateStorage.getLastBlock().data;
            }

            blockchain.dispatch("NOBLOCK");
        }
    },

    async startForkRecovery() {
        logger.info("Starting fork recovery");

        blockchain.clearAndStopQueue();

        const random: number = 4 + Math.floor(Math.random() * 99); // random int inside [4, 102] range
        const blocksToRemove: number = stateStorage.numberOfBlocksToRollback || random;

        await blockchain.removeBlocks(blocksToRemove);

        stateStorage.numberOfBlocksToRollback = undefined;

        logger.info(`Removed ${AppUtils.pluralize("block", blocksToRemove, true)}`);

        await transactionPool.buildWallets();
        await app.get<Contracts.P2P.INetworkMonitor>(Container.Identifiers.PeerNetworkMonitor).refreshPeersAfterFork();

        blockchain.dispatch("SUCCESS");
    },

    async rollbackDatabase() {
        logger.info("Trying to restore database integrity");

        const { maxBlockRewind, steps } = app
            .get<Providers.ServiceProviderRepository>(Container.Identifiers.ServiceProviderRepository)
            .get("@arkecosystem/core-blockchain")
            .config()
            .get<Record<string, number>>("databaseRollback");

        for (let i = maxBlockRewind; i >= 0; i -= steps) {
            await blockchain.removeTopBlocks(steps);

            if (await database.verifyBlockchain()) {
                break;
            }
        }

        if (!(await database.verifyBlockchain())) {
            blockchain.dispatch("FAILURE");
            return;
        }

        database.restoredDatabaseIntegrity = true;

        const lastBlock: Interfaces.IBlock = await database.getLastBlock();
        logger.info(
            `Database integrity verified again after rollback to height ${lastBlock.data.height.toLocaleString()}`,
        );

        blockchain.dispatch("SUCCESS");
    },
});

export const stateMachine = blockchainMachine;
