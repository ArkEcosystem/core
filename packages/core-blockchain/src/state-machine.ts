/* tslint:disable:jsdoc-format max-line-length */

import { app } from "@arkecosystem/core-container";
import { EventEmitter, Logger } from "@arkecosystem/core-interfaces";

import { roundCalculator } from "@arkecosystem/core-utils";
import { isException, models } from "@arkecosystem/crypto";

import pluralize from "pluralize";
import { config as localConfig } from "./config";
import { blockchainMachine } from "./machines/blockchain";
import { stateStorage } from "./state-storage";
import { isBlockChained } from "./utils";

import { Blockchain } from "./blockchain";

const { Block } = models;
const config = app.getConfig();
const emitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger = app.resolvePlugin<Logger.ILogger>("logger");

/**
 * @type {IStateStorage}
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
            emitter.emit("state:started", true);
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
        logger.debug(`Queued blocks (process: ${blockchain.queue.length()})`);

        if (blockchain.queue.length() > 10000) {
            event = "PAUSED";
        }

        // tried to download but no luck after 5 tries (looks like network missing blocks)
        if (stateStorage.noBlockCounter > 5 && blockchain.queue.length() === 0) {
            logger.info("Tried to sync 5 times to different nodes, looks like the network is missing blocks");

            stateStorage.noBlockCounter = 0;
            event = "NETWORKHALTED";

            if (stateStorage.p2pUpdateCounter + 1 > 3) {
                logger.info("Network keeps missing blocks.");

                const networkStatus = await blockchain.p2p.checkNetworkHealth();
                if (networkStatus.forked) {
                    stateStorage.numberOfBlocksToRollback = networkStatus.blocksToRollback;
                    event = "FORK";
                }

                stateStorage.p2pUpdateCounter = 0;
            } else {
                stateStorage.p2pUpdateCounter++;
            }
        }

        if (blockchain.isSynced(stateStorage.lastDownloadedBlock)) {
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
        } else if (blockchain.queue.length() === 0) {
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
        app.forceExit("Failed to startup blockchain. Exiting Ark Core!");
    },

    async init() {
        try {
            let block = await blockchain.database.getLastBlock();

            if (!block) {
                logger.warn("No block found in database");

                block = new Block(config.get("genesisBlock"));

                if (block.data.payloadHash !== config.get("network.nethash")) {
                    logger.error("FATAL: The genesis block payload hash is different from configured the nethash");

                    return blockchain.dispatch("FAILURE");
                }

                await blockchain.database.saveBlock(block);
            }

            if (!blockchain.database.restoredDatabaseIntegrity) {
                logger.info("Verifying database integrity");

                const blockchainAudit = await blockchain.database.verifyBlockchain();
                if (!blockchainAudit.valid) {
                    logger.error("FATAL: The database is corrupted");
                    logger.error(JSON.stringify(blockchainAudit.errors, null, 4));

                    return blockchain.dispatch("ROLLBACK");
                }

                logger.info("Verified database integrity");
            } else {
                logger.info("Skipping database integrity check after successful database recovery");
            }

            // only genesis block? special case of first round needs to be dealt with
            if (block.data.height === 1) {
                await blockchain.database.deleteRound(1);
            }

            /** *******************************
             *  state machine data init      *
             ******************************* */
            stateStorage.setLastBlock(block);
            stateStorage.lastDownloadedBlock = block;

            // NOTE: if the node is shutdown between round, the round has already been applied
            if (roundCalculator.isNewRound(block.data.height + 1)) {
                const { round } = roundCalculator.calculateRound(block.data.height + 1);

                logger.info(
                    `New round ${round.toLocaleString()} detected. Cleaning calculated data before restarting!`,
                );

                await blockchain.database.deleteRound(round);
            }

            if (stateStorage.networkStart) {
                await blockchain.database.buildWallets();
                await blockchain.database.applyRound(block.data.height);
                await blockchain.transactionPool.buildWallets();

                return blockchain.dispatch("STARTED");
            }

            if (process.env.NODE_ENV === "test") {
                logger.verbose("TEST SUITE DETECTED! SYNCING WALLETS AND STARTING IMMEDIATELY.");

                stateStorage.setLastBlock(new Block(config.get("genesisBlock")));
                await blockchain.database.buildWallets();

                return blockchain.dispatch("STARTED");
            }

            logger.info(`Last block in database: ${block.data.height.toLocaleString()}`);

            /** *******************************
             * database init                 *
             ******************************* */
            // Integrity Verification
            const verifiedWalletsIntegrity = await blockchain.database.buildWallets();
            if (!verifiedWalletsIntegrity && block.data.height > 1) {
                logger.warn(
                    "Rebuilding wallets table because of some inconsistencies. Most likely due to an unfortunate shutdown.",
                );
            }

            await blockchain.database.restoreCurrentRound(block.data.height);
            await blockchain.transactionPool.buildWallets();

            return blockchain.dispatch("STARTED");
        } catch (error) {
            logger.error(error.stack);

            return blockchain.dispatch("FAILURE");
        }
    },

    async downloadBlocks() {
        const lastDownloadedBlock = stateStorage.lastDownloadedBlock || stateStorage.getLastBlock();
        const blocks = await blockchain.p2p.downloadBlocks(lastDownloadedBlock.data.height);

        if (blockchain.isStopped) {
            return;
        }

        // Could have changed since entering this function, e.g. due to a rollback.
        if (lastDownloadedBlock.data.id !== stateStorage.lastDownloadedBlock.data.id) {
            return;
        }

        const empty = !blocks || blocks.length === 0;
        const chained = !empty && (isBlockChained(lastDownloadedBlock, { data: blocks[0] }) || isException(blocks[0]));

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

            stateStorage.noBlockCounter = 0;
            stateStorage.p2pUpdateCounter = 0;

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
                logger.info("No new block found on this peer");
            } else {
                logger.warn(`Downloaded block not accepted: ${JSON.stringify(blocks[0])}`);
                logger.warn(`Last downloaded block: ${JSON.stringify(lastDownloadedBlock.data)}`);
                blockchain.clearQueue();
            }

            if (blockchain.queue.length() === 0) {
                stateStorage.noBlockCounter++;
                stateStorage.lastDownloadedBlock = stateStorage.getLastBlock();
            }

            blockchain.dispatch("NOBLOCK");
        }
    },

    async analyseFork() {
        logger.info("Analysing fork");
    },

    async startForkRecovery() {
        logger.info("Starting fork recovery");
        blockchain.clearAndStopQueue();

        await blockchain.database.commitQueuedQueries();

        const random = 4 + Math.floor(Math.random() * 99); // random int inside [4, 102] range

        await blockchain.removeBlocks(stateStorage.numberOfBlocksToRollback || random);
        stateStorage.numberOfBlocksToRollback = null;

        logger.info(`Removed ${pluralize("block", random, true)}`);

        await blockchain.transactionPool.buildWallets();
        await blockchain.p2p.refreshPeersAfterFork();

        blockchain.dispatch("SUCCESS");
    },

    async rollbackDatabase() {
        logger.info("Trying to restore database integrity");

        const { maxBlockRewind, steps } = localConfig.get("databaseRollback");
        let blockchainAudit;

        for (let i = maxBlockRewind; i >= 0; i -= steps) {
            await blockchain.removeTopBlocks(steps);

            blockchainAudit = await blockchain.database.verifyBlockchain();
            if (blockchainAudit.valid) {
                break;
            }
        }

        if (!blockchainAudit.valid) {
            // TODO: multiple attempts? rewind further? restore snapshot?
            logger.error("FATAL: Failed to restore database integrity");
            logger.error(JSON.stringify(blockchainAudit.errors, null, 4));
            blockchain.dispatch("FAILURE");
            return;
        }

        blockchain.database.restoredDatabaseIntegrity = true;

        const lastBlock = await blockchain.database.getLastBlock();
        logger.info(
            `Database integrity verified again after rollback to height ${lastBlock.data.height.toLocaleString()}`,
        );

        blockchain.dispatch("SUCCESS");
    },
});

export const stateMachine = blockchainMachine;
