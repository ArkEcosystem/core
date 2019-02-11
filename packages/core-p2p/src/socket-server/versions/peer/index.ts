import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, Logger, P2P } from "@arkecosystem/core-interfaces";
import { TransactionGuard, TransactionPool } from "@arkecosystem/core-transaction-pool";
import { Joi, models, slots } from "@arkecosystem/crypto";

import pluralize from "pluralize";
import { monitor } from "../../../monitor";

const { Block } = models;

const transactionPool = app.resolvePlugin<TransactionPool>("transactionPool");
const logger = app.resolvePlugin<Logger.ILogger>("logger");

/**
 * @type {Object}
 */
export const auth = {
    /**
     */
    async handler(data, res) {
        try {
            const requiredHeaders = ["nethash", "milestoneHash", "version", "port", "os"];

            const peer = { ip: data.ip };

            requiredHeaders.forEach(key => {
                peer[key] = data.headers[key];
            });

            try {
                await monitor.acceptNewPeer(peer);
                return res();
            } catch (error) {
                return res(error);
            }
        } catch (error) {
            return res(error);
        }
    },
};

/**
 * @type {Object}
 */
export const getPeers = {
    async handler(data, res) {
        try {
            const peers = monitor
                .getPeers()
                .map(peer => peer.toBroadcastInfo())
                .sort((a, b) => a.delay - b.delay);

            return res(null, {
                success: true,
                peers,
            });
        } catch (error) {
            return res(error);
        }
    },
};

/**
 * @type {Object}
 */
export const getHeight = {
    handler(data, res) {
        const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

        return res(null, {
            success: true,
            height: lastBlock.data.height,
            id: lastBlock.data.id,
        });
    },
};

/**
 * @type {Object}
 */
export const getCommonBlocks = {
    async handler(data, res) {
        if (!data.ids) {
            return res(null, {
                success: false,
            });
        }

        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

        const ids = data.ids
            .split(",")
            .slice(0, 9)
            .filter(id => id.match(/^\d+$/));

        try {
            const commonBlocks = await blockchain.database.getCommonBlocks(ids);

            return res(null, {
                success: true,
                common: commonBlocks.length ? commonBlocks[0] : null,
                lastBlockHeight: blockchain.getLastBlock().data.height,
            });
        } catch (error) {
            return res(error);
        }
    },
};

/**
 * @type {Object}
 */
export const getTransactions = {
    handler(data, res) {
        return res(null, { success: true, transactions: [] });
    },
};

/**
 * @type {Object}
 */
export const getStatus = {
    handler(data, res) {
        const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

        return res(null, {
            success: true,
            height: lastBlock ? lastBlock.data.height : 0,
            forgingAllowed: slots.isForgingAllowed(),
            currentSlot: slots.getSlotNumber(),
            header: lastBlock ? lastBlock.getHeader() : {},
        });
    },
};

/**
 * @type {Object}
 */
export const postBlock = {
    async handler(data, res) {
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

        try {
            if (!data || !data.block) {
                return res(null, { success: false });
            }

            const block = data.block;

            if (blockchain.pingBlock(block)) {
                return res(null, { success: true });
            }
            // already got it?
            const lastDownloadedBlock = blockchain.getLastDownloadedBlock();

            // Are we ready to get it?
            if (lastDownloadedBlock && lastDownloadedBlock.data.height + 1 !== block.height) {
                return res(null, { success: true });
            }

            const b = new Block(block);

            if (!b.verification.verified) {
                return res(null, { success: false });
            }

            blockchain.pushPingBlock(b.data);

            block.ip = data.info.remoteAddress;
            blockchain.handleIncomingBlock(block);

            return res(null, { success: true });
        } catch (error) {
            logger.error(error);
            return res(error, { success: false });
        }
    },
};

/**
 * @type {Object}
 */
export const postTransactions = {
    async handler(data, res) {
        if (!transactionPool) {
            return res(null, {
                success: false,
                message: "Transaction pool not available",
            });
        }

        const guard = new TransactionGuard(transactionPool);

        const result = await guard.validate(data.transactions);

        if (result.invalid.length > 0) {
            return res(null, {
                success: false,
                message: "Transactions list is not conform",
                error: "Transactions list is not conform",
            });
        }

        if (result.broadcast.length > 0) {
            app.resolvePlugin<P2P.IMonitor>("p2p").broadcastTransactions(guard.getBroadcastTransactions());
        }

        return res(null, {
            success: true,
            transactionIds: result.accept,
        });
    },
    options: {
        cors: {
            additionalHeaders: ["nethash", "port", "version"],
        },
        validate: {
            payload: {
                transactions: Joi.transactionArray()
                    .min(1)
                    .max(app.resolveOptions("transactionPool").maxTransactionsPerRequest)
                    .options({ stripUnknown: true }),
            },
        },
    },
};

/**
 * @type {Object}
 */
export const getBlocks = {
    async handler(data, res) {
        try {
            const database = app.resolvePlugin<Database.IDatabaseService>("database");
            const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

            const reqBlockHeight = +data.lastBlockHeight + 1;
            let blocks = [];

            if (!data.lastBlockHeight || isNaN(reqBlockHeight)) {
                blocks.push(blockchain.getLastBlock());
            } else {
                blocks = await database.getBlocks(reqBlockHeight, 400);
            }

            logger.info(
                `${data.info.remoteAddress} has downloaded ${pluralize(
                    "block",
                    blocks.length,
                    true,
                )} from height ${(!isNaN(reqBlockHeight) ? reqBlockHeight : blocks[0].data.height).toLocaleString()}`,
            );

            return res(null, { success: true, blocks: blocks || [] });
        } catch (error) {
            logger.error(error.stack);

            return res(error);
        }
    },
};
