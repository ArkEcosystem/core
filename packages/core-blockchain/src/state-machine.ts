/* tslint:disable:jsdoc-format max-line-length */

import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { EventEmitter, Logger, State } from "@arkecosystem/core-interfaces";
import { isBlockChained, roundCalculator } from "@arkecosystem/core-utils";
import { Interfaces, Utils } from "@arkecosystem/crypto";

import pluralize from "pluralize";
import { blockchainMachine } from "./machines/blockchain";

import { Blockchain } from "./blockchain";

const config = app.getConfig();
const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger = app.resolvePlugin<Logger.ILogger>("logger");
const stateStorage = app.resolvePlugin<State.IStateService>("state").getStore();

/**
 * @type {IStateStore}
 */
blockchainMachine.state = stateStorage;

/**
 * The blockchain actions.
 * @param  {Blockchain} blockchain
 * @return {Object}
 */
blockchainMachine.actionMap = (blockchain: Blockchain) => ({
    blockchainReady: () => {
        if (!stateStorage.started) {
            stateStorage.started = true;
            emitter.emit(ApplicationEvents.StateStarted, true);
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

                const networkStatus = await blockchain.p2p.getMonitor().checkNetworkHealth();
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
        app.forceExit("Failed to startup blockchain. Exiting ARK Core!");
    },

    async init() {
        try {
            const block: Interfaces.IBlock = blockchain.state.getLastBlock();

            if (!blockchain.database.restoredDatabaseIntegrity) {
                logger.info("Verifying database integrity");

                if (!(await blockchain.database.verifyBlockchain())) {
                    return blockchain.dispatch("ROLLBACK");
                }

                logger.info("Verified database integrity");
            } else {
                logger.info("Skipping database integrity check after successful database recovery");
            }

            // only genesis block? special case of first round needs to be dealt with
            if (block.data.height === 1) {
                if (block.data.payloadHash !== config.get("network.nethash")) {
                    logger.error("FATAL: The genesis block payload hash is different from configured the nethash");

                    return blockchain.dispatch("FAILURE");
                }

                await blockchain.database.deleteRound(1);
            }

            /** *******************************
             *  state machine data init      *
             ******************************* */
            stateStorage.setLastBlock(block);

            // Delete all rounds from the future due to shutdown before processBlocks finished writing the blocks.
            const roundInfo = roundCalculator.calculateRound(block.data.height);
            await blockchain.database.deleteRound(roundInfo.round + 1);

            if (stateStorage.networkStart) {
                await blockchain.database.buildWallets();
                await blockchain.database.restoreCurrentRound(block.data.height);
                await blockchain.transactionPool.buildWallets();
                await blockchain.p2p.getMonitor().start();

                return blockchain.dispatch("STARTED");
            }

            if (process.env.NODE_ENV === "test") {
                logger.verbose("TEST SUITE DETECTED! SYNCING WALLETS AND STARTING IMMEDIATELY.");

                await blockchain.database.buildWallets();
                await blockchain.p2p.getMonitor().start();

                return blockchain.dispatch("STARTED");
            }

            logger.info(`Last block in database: ${block.data.height.toLocaleString()}`);

            /** *******************************
             * database init                 *
             ******************************* */
            // Integrity Verification
            await blockchain.database.buildWallets();

            await blockchain.database.restoreCurrentRound(block.data.height);
            await blockchain.transactionPool.buildWallets();

            await blockchain.p2p.getMonitor().start();

            return blockchain.dispatch("STARTED");
        } catch (error) {
            logger.error(error.stack);

            return blockchain.dispatch("FAILURE");
        }
    },

    async downloadBlocks() {
        const lastDownloadedBlock: Interfaces.IBlockData =
            stateStorage.lastDownloadedBlock || stateStorage.getLastBlock().data;
        const blocks: Interfaces.IBlockData[] = await blockchain.p2p
            .getMonitor()
            .downloadBlocksFromHeight(lastDownloadedBlock.height);

        if (blockchain.isStopped) {
            return;
        }

        // Could have changed since entering this function, e.g. due to a rollback.
        if (stateStorage.lastDownloadedBlock && lastDownloadedBlock.id !== stateStorage.lastDownloadedBlock.id) {
            return;
        }

        const empty: boolean = !blocks || blocks.length === 0;
        const chained: boolean =
            !empty && (isBlockChained(lastDownloadedBlock, blocks[0]) || Utils.isException(blocks[0]));

        if (chained) {
            logger.info(
                `Downloaded ${blocks.length} new ${pluralize(
                    "block",
                    blocks.length,
                )} accounting for a total of ${pluralize(
                    "transaction",
                    blocks.reduce((sum, b) => sum + b.numberOfTransactions, 0),
                    true,
                )}`,
            );

            try {
                blockchain.enqueueBlocks(blocks);
                blockchain.dispatch("DOWNLOADED");
            } catch (error) {
                logger.warn(`Failed to enqueue downloaded block.`);

                blockchain.dispatch("NOBLOCK");

                return;
            }
        } else {
            if (empty) {
                logger.info(
                    `Could not download any blocks from any peer from height ${lastDownloadedBlock.height + 1}`,
                );
            } else {
                logger.warn(`Downloaded block not accepted: ${JSON.stringify(blocks[0])}`);
                logger.warn(`Last downloaded block: ${JSON.stringify(lastDownloadedBlock)}`);

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

        logger.info(`Removed ${pluralize("block", blocksToRemove, true)}`);

        await blockchain.p2p.getMonitor().refreshPeersAfterFork();

        blockchain.dispatch("SUCCESS");
        blockchain.queue.resume();
    },

    async rollbackDatabase() {
        logger.info("Trying to restore database integrity");

        const { maxBlockRewind, steps } = app.resolveOptions("blockchain").databaseRollback;

        for (let i = maxBlockRewind; i >= 0; i -= steps) {
            await blockchain.removeTopBlocks(steps);

            if (await blockchain.database.verifyBlockchain()) {
                break;
            }
        }

        if (!(await blockchain.database.verifyBlockchain())) {
            blockchain.dispatch("FAILURE");
            return;
        }

        blockchain.database.restoredDatabaseIntegrity = true;

        const lastBlock: Interfaces.IBlock = await blockchain.database.getLastBlock();
        logger.info(
            `Database integrity verified again after rollback to height ${lastBlock.data.height.toLocaleString()}`,
        );

        blockchain.dispatch("SUCCESS");
    },
});

export const stateMachine = blockchainMachine;
