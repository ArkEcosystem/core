import { app } from "@arkecosystem/core-container";
import { AbstractLogger } from "@arkecosystem/core-logger";
import { TransactionGuard } from "@arkecosystem/core-transaction-pool";
import { crypto, Joi, models, slots } from "@arkecosystem/crypto";

import pluralize from "pluralize";
import { monitor } from "../../../monitor";

const { Block, Transaction } = models;

const transactionPool = app.resolvePlugin("transactionPool");
const config = app.getConfig();
const logger = app.resolvePlugin<AbstractLogger>("logger");

/**
 * @type {Object}
 */
export const getPeers = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        try {
            const peers = monitor
                .getPeers()
                .map(peer => peer.toBroadcastInfo())
                .sort((a, b) => a.delay - b.delay);

            return {
                success: true,
                peers,
            };
        } catch (error) {
            return h
                .response({ success: false, message: error.message })
                .code(500)
                .takeover();
        }
    },
};

/**
 * @type {Object}
 */
export const getHeight = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    handler(request, h) {
        const lastBlock = app.resolvePlugin("blockchain").getLastBlock();

        return {
            success: true,
            height: lastBlock.data.height,
            id: lastBlock.data.id,
        };
    },
};

/**
 * @type {Object}
 */
export const getCommonBlocks = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        if (!request.query.ids) {
            return {
                success: false,
            };
        }

        const blockchain = app.resolvePlugin("blockchain");

        const ids = request.query.ids
            .split(",")
            .slice(0, 9)
            .filter(id => id.match(/^\d+$/));

        try {
            const commonBlocks = await blockchain.database.getCommonBlocks(ids);

            return {
                success: true,
                common: commonBlocks.length ? commonBlocks[0] : null,
                lastBlockHeight: blockchain.getLastBlock().data.height,
            };
        } catch (error) {
            return h
                .response({ success: false, message: error.message })
                .code(500)
                .takeover();
        }
    },
};

/**
 * @type {Object}
 */
export const getTransactionsFromIds = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        try {
            const blockchain = app.resolvePlugin("blockchain");
            const maxTransactions = config.getMilestone(blockchain.getLastHeight()).block.maxTransactions;

            const transactionIds = request.query.ids
                .split(",")
                .slice(0, maxTransactions)
                .filter(id => id.match("[0-9a-fA-F]{32}"));

            const rows = await app.resolvePlugin("database").getTransactionsFromIds(transactionIds);

            // TODO: v1 compatibility patch. Add transformer and refactor later on
            const transactions = await rows.map(row => {
                const transaction = Transaction.deserialize(row.serialized.toString("hex"));
                transaction.blockId = row.block_id;
                transaction.senderId = crypto.getAddress(transaction.senderPublicKey);
                return transaction;
            });

            transactionIds.forEach((transaction, i) => {
                transactionIds[i] = transactions.find(tx2 => tx2.id === transactionIds[i]);
            });

            return { success: true, transactions: transactionIds };
        } catch (error) {
            return h
                .response({ success: false, message: error.message })
                .code(500)
                .takeover();
        }
    },
};

/**
 * @type {Object}
 */
export const getTransactions = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    handler(request, h) {
        return { success: true, transactions: [] };
    },
};

/**
 * @type {Object}
 */
export const getStatus = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    handler(request, h) {
        const lastBlock = app.resolvePlugin("blockchain").getLastBlock();

        return {
            success: true,
            height: lastBlock ? lastBlock.data.height : 0,
            forgingAllowed: slots.isForgingAllowed(),
            currentSlot: slots.getSlotNumber(),
            header: lastBlock ? lastBlock.getHeader() : {},
        };
    },
};

/**
 * @type {Object}
 */
export const postBlock = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        const blockchain = app.resolvePlugin("blockchain");

        try {
            if (!request.payload || !request.payload.block) {
                return { success: false };
            }

            const block = request.payload.block;

            if (blockchain.pingBlock(block)) {
                return { success: true };
            }
            // already got it?
            const lastDownloadedBlock = blockchain.getLastDownloadedBlock();

            // Are we ready to get it?
            if (lastDownloadedBlock && lastDownloadedBlock.data.height + 1 !== block.height) {
                return { success: true };
            }

            const b = new Block(block);

            if (!b.verification.verified) {
                return { success: false };
            }

            blockchain.pushPingBlock(b.data);

            if (b.headerOnly) {
                // let missingIds = []
                let transactions = [];
                // if (transactionPool) {
                //   transactions = block.transactionIds
                //    .map(async id => await transactionPool.getTransaction(id) || id)
                //   missingIds = transactions.filter(tx => !tx.id)
                // } else {
                //   missingIds = block.transactionIds.slice(0)
                // }
                // if (missingIds.length > 0) {
                let peer = await monitor.getPeer(request.info.remoteAddress);
                // only for test because it can be used for DDOS attack
                if (!peer && process.env.NODE_ENV === "test_p2p") {
                    peer = await monitor.getRandomPeer();
                }

                if (!peer) {
                    return { success: false };
                }

                transactions = await peer.getTransactionsFromIds(block.transactionIds);
                // issue on v1, using /api/ instead of /peer/
                if (transactions.length < block.transactionIds.length) {
                    transactions = await peer.getTransactionsFromBlock(block.id);
                }

                // reorder them correctly
                block.transactions = block.transactionIds.map(id => transactions.find(tx => tx.id === id));
                logger.debug(`Found missing transactions: ${block.transactions.map(tx => tx.id)}`);

                if (block.transactions.length !== block.numberOfTransactions) {
                    return { success: false };
                }
            }
            // } else return { success: false }

            block.ip = request.info.remoteAddress;
            blockchain.queueBlock(block);

            return { success: true };
        } catch (error) {
            logger.error(error);
            return { success: false };
        }
    },
};

/**
 * @type {Object}
 */
export const postTransactions = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        if (!transactionPool) {
            return {
                success: false,
                message: "Transaction pool not available",
            };
        }

        const guard = new TransactionGuard(transactionPool);

        const result = await guard.validate(request.payload.transactions);

        if (result.invalid.length > 0) {
            return {
                success: false,
                message: "Transactions list is not conform",
                error: "Transactions list is not conform",
            };
        }

        if (result.broadcast.length > 0) {
            app.resolvePlugin("p2p").broadcastTransactions(guard.getBroadcastTransactions());
        }

        return {
            success: true,
            transactionIds: result.accept,
        };
    },
    options: {
        cors: {
            additionalHeaders: ["nethash", "port", "version"],
        },
        validate: {
            payload: {
                transactions: Joi.arkTransactionArray()
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
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        try {
            const database = app.resolvePlugin("database");
            const blockchain = app.resolvePlugin("blockchain");

            const reqBlockHeight = +request.query.lastBlockHeight + 1;
            let blocks = [];

            if (!request.query.lastBlockHeight || isNaN(reqBlockHeight)) {
                blocks.push(blockchain.getLastBlock());
            } else {
                blocks = await database.getBlocks(reqBlockHeight, 400);
            }

            logger.info(
                `${request.info.remoteAddress} has downloaded ${pluralize(
                    "block",
                    blocks.length,
                    true,
                )} from height ${(!isNaN(reqBlockHeight) ? reqBlockHeight : blocks[0].data.height).toLocaleString()}`,
            );

            return { success: true, blocks: blocks || [] };
        } catch (error) {
            logger.error(error.stack);

            return h.response({ success: false, error }).code(500);
        }
    },
};
