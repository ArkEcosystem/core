/* tslint:disable:jsdoc-format max-line-length */

import { app } from "@arkecosystem/core-container";
import { EventEmitter, Logger } from "@arkecosystem/core-interfaces";

import { roundCalculator } from "@arkecosystem/core-utils";
import { isException, models, slots } from "@arkecosystem/crypto";

import pluralize from "pluralize";
import { config as localConfig } from "./config";
import { blockchainMachine } from "./machines/blockchain";
import { stateStorage } from "./state-storage";
import { isBlockChained, tickSyncTracker } from "./utils";

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

    checkRebuildBlockSynced() {
        return blockchain.dispatch(blockchain.isRebuildSynced() ? "SYNCED" : "NOTSYNCED");
    },

    async checkLastDownloadedBlockSynced() {
        let event = "NOTSYNCED";
        logger.debug(
            `Queued blocks (rebuild: ${blockchain.rebuildQueue.length()} process: ${blockchain.processQueue.length()})`,
        );

        if (blockchain.rebuildQueue.length() > 10000 || blockchain.processQueue.length() > 10000) {
            event = "PAUSED";
        }

        // tried to download but no luck after 5 tries (looks like network missing blocks)
        if (stateStorage.noBlockCounter > 5 && blockchain.processQueue.length() === 0) {
            // TODO: make this dynamic in 2.1
            logger.info(
                "Tried to sync 5 times to different nodes, looks like the network is missing blocks :umbrella:",
            );

            stateStorage.noBlockCounter = 0;
            event = "NETWORKHALTED";

            if (stateStorage.p2pUpdateCounter + 1 > 3) {
                logger.info("Network keeps missing blocks. :umbrella:");

                const result = await blockchain.p2p.updatePeersOnMissingBlocks();
                stateStorage.numberOfBlocksToRollback = result;
                if (result) {
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
        logger.info("Block download finished :rocket:");

        if (stateStorage.networkStart) {
            // next time we will use normal behaviour
            stateStorage.networkStart = false;

            blockchain.dispatch("SYNCFINISHED");
        } else if (blockchain.rebuildQueue.length() === 0) {
            blockchain.dispatch("PROCESSFINISHED");
        }
    },

    async rebuildFinished() {
        try {
            logger.info("Blockchain rebuild finished :chains:");

            stateStorage.rebuild = false;

            await blockchain.database.commitQueuedQueries();
            await blockchain.rollbackCurrentRound();
            await blockchain.database.buildWallets(stateStorage.getLastBlock().data.height);
            await blockchain.database.saveWallets(true);
            await blockchain.transactionPool.buildWallets();

            return blockchain.dispatch("PROCESSFINISHED");
        } catch (error) {
            logger.error(error.stack);
            return blockchain.dispatch("FAILURE");
        }
    },

    downloadPaused: () => logger.info("Blockchain download paused :clock1030:"),

    syncingComplete() {
        logger.info("Blockchain 100% in sync :100:");
        blockchain.dispatch("SYNCFINISHED");
    },

    rebuildingComplete() {
        logger.info("Blockchain rebuild complete :unicorn_face:");
        blockchain.dispatch("REBUILDCOMPLETE");
    },

    stopped() {
        logger.info("The blockchain has been stopped :guitar:");
    },

    exitApp() {
        app.forceExit("Failed to startup blockchain. Exiting Ark Core! :rotating_light:");
    },

    async init() {
        try {
            let block = await blockchain.database.getLastBlock();

            if (!block) {
                logger.warn("No block found in database :hushed:");

                block = new Block(config.get("genesisBlock"));

                if (block.data.payloadHash !== config.get("network.nethash")) {
                    logger.error(
                        "FATAL: The genesis block payload hash is different from configured the nethash :rotating_light:",
                    );

                    return blockchain.dispatch("FAILURE");
                }

                await blockchain.database.saveBlock(block);
            }

            if (!blockchain.database.restoredDatabaseIntegrity) {
                logger.info("Verifying database integrity :hourglass_flowing_sand:");

                const blockchainAudit = await blockchain.database.verifyBlockchain();
                if (!blockchainAudit.valid) {
                    logger.error("FATAL: The database is corrupted :fire:");
                    logger.error(JSON.stringify(blockchainAudit.errors, null, 4));

                    return blockchain.dispatch("ROLLBACK");
                }

                logger.info("Verified database integrity :smile_cat:");
            } else {
                logger.info("Skipping database integrity check after successful database recovery :smile_cat:");
            }

            // only genesis block? special case of first round needs to be dealt with
            if (block.data.height === 1) {
                await blockchain.database.deleteRound(1);
            }

            /** *******************************
             *  state machine data init      *
             ******************************* */
            const constants = config.getMilestone(block.data.height);
            stateStorage.setLastBlock(block);
            stateStorage.lastDownloadedBlock = block;

            if (stateStorage.networkStart) {
                await blockchain.database.buildWallets(block.data.height);
                await blockchain.database.saveWallets(true);
                await blockchain.database.applyRound(block.data.height);
                await blockchain.transactionPool.buildWallets();

                return blockchain.dispatch("STARTED");
            }

            stateStorage.rebuild =
                slots.getTime() - block.data.timestamp > (constants.activeDelegates + 1) * constants.blocktime;
            // no fast rebuild if in last week
            stateStorage.fastRebuild =
                slots.getTime() - block.data.timestamp > 3600 * 24 * 7 && !!localConfig.get("fastRebuild");

            if (process.env.NODE_ENV === "test") {
                logger.verbose("TEST SUITE DETECTED! SYNCING WALLETS AND STARTING IMMEDIATELY. :bangbang:");

                stateStorage.setLastBlock(new Block(config.get("genesisBlock")));
                await blockchain.database.buildWallets(block.data.height);

                return blockchain.dispatch("STARTED");
            }

            logger.info(`Fast rebuild: ${stateStorage.fastRebuild}`);
            logger.info(`Last block in database: ${block.data.height.toLocaleString()}`);

            if (stateStorage.fastRebuild) {
                return blockchain.dispatch("REBUILD");
            }

            // removing blocks up to the last round to compute active delegate list later if needed
            const activeDelegates = await blockchain.database.getActiveDelegates(block.data.height);

            if (!activeDelegates) {
                await blockchain.rollbackCurrentRound();
            }

            /** *******************************
             * database init                 *
             ******************************* */
            // SPV rebuild
            const verifiedWalletsIntegrity = await blockchain.database.buildWallets(block.data.height);
            if (!verifiedWalletsIntegrity && block.data.height > 1) {
                logger.warn(
                    "Rebuilding wallets table because of some inconsistencies. Most likely due to an unfortunate shutdown. :hammer:",
                );
                await blockchain.database.saveWallets(true);
            }

            // NOTE: if the node is shutdown between round, the round has already been applied
            if (roundCalculator.isNewRound(block.data.height + 1)) {
                const { round } = roundCalculator.calculateRound(block.data.height + 1);

                logger.info(
                    `New round ${round.toLocaleString()} detected. Cleaning calculated data before restarting!`,
                );

                await blockchain.database.deleteRound(round);
            }

            await blockchain.database.applyRound(block.data.height);
            await blockchain.transactionPool.buildWallets();

            return blockchain.dispatch("STARTED");
        } catch (error) {
            logger.error(error.stack);

            return blockchain.dispatch("FAILURE");
        }
    },

    async rebuildBlocks() {
        const lastBlock = stateStorage.lastDownloadedBlock || stateStorage.getLastBlock();
        const blocks = await blockchain.p2p.downloadBlocks(lastBlock.data.height);

        tickSyncTracker(blocks.length, lastBlock.data.height);

        if (!blocks || blocks.length === 0) {
            logger.info("No new blocks found on this peer");

            blockchain.dispatch("NOBLOCK");
        } else {
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

            if (blocks.length && blocks[0].previousBlock === lastBlock.data.id) {
                stateStorage.lastDownloadedBlock = { data: blocks.slice(-1)[0] };
                blockchain.rebuildQueue.push(blocks);
                blockchain.dispatch("DOWNLOADED");
            } else {
                logger.warn(`Downloaded block not accepted: ${JSON.stringify(blocks[0])}`);
                logger.warn(`Last block: ${JSON.stringify(lastBlock.data)}`);

                // disregard the whole block list
                blockchain.dispatch("NOBLOCK");
            }
        }
    },

    async downloadBlocks() {
        const lastDownloadedBlock = stateStorage.lastDownloadedBlock || stateStorage.getLastBlock();
        const blocks = await blockchain.p2p.downloadBlocks(lastDownloadedBlock.data.height);

        if (blockchain.isStopped) {
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

            blockchain.enqueueBlocks(blocks);
            blockchain.dispatch("DOWNLOADED");
        } else {
            if (empty) {
                logger.info("No new block found on this peer");
            } else {
                logger.warn(`Downloaded block not accepted: ${JSON.stringify(blocks[0])}`);
                logger.warn(`Last downloaded block: ${JSON.stringify(lastDownloadedBlock.data)}`);
                blockchain.processQueue.clear();
            }

            stateStorage.noBlockCounter++;
            stateStorage.lastDownloadedBlock = stateStorage.getLastBlock();

            blockchain.dispatch("NOBLOCK");
        }
    },

    async analyseFork() {
        logger.info("Analysing fork :mag:");
    },

    async startForkRecovery() {
        logger.info("Starting fork recovery :fork_and_knife:");
        blockchain.clearAndStopQueue();

        await blockchain.database.commitQueuedQueries();

        const random = 4 + Math.floor(Math.random() * 99); // random int inside [4, 102] range

        await blockchain.removeBlocks(stateStorage.numberOfBlocksToRollback || random);
        stateStorage.numberOfBlocksToRollback = null;

        logger.info(`Removed ${pluralize("block", random, true)} :wastebasket:`);

        await blockchain.transactionPool.buildWallets();
        await blockchain.p2p.refreshPeersAfterFork();

        blockchain.dispatch("SUCCESS");
    },

    async rollbackDatabase() {
        logger.info("Trying to restore database integrity :fire_engine:");

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
            logger.error("FATAL: Failed to restore database integrity :skull: :skull: :skull:");
            logger.error(JSON.stringify(blockchainAudit.errors, null, 4));
            blockchain.dispatch("FAILURE");
            return;
        }

        blockchain.database.restoredDatabaseIntegrity = true;

        const lastBlock = await blockchain.database.getLastBlock();
        logger.info(
            `Database integrity verified again after rollback to height ${lastBlock.data.height.toLocaleString()} :green_heart:`,
        );

        blockchain.dispatch("SUCCESS");
    },
});

const stateMachine = blockchainMachine;
export { stateMachine };
