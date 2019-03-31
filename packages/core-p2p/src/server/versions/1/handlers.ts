import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, Logger, P2P, TransactionPool } from "@arkecosystem/core-interfaces";
import { TransactionGuard } from "@arkecosystem/core-transaction-pool";
import { AjvWrapper, models, slots } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { monitor } from "../../../monitor";
import { schema } from "./schema";

const { Block } = models;

const transactionPool = app.resolvePlugin<TransactionPool.IConnection>("transaction-pool");
const logger = app.resolvePlugin<Logger.ILogger>("logger");

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
        const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

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

        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

        const ids = request.query.ids.split(",").filter(id => AjvWrapper.instance().validate({ blockId: {} }, id));

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
        const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

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
    handler: async (request, h) => {
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

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

            block.ip = request.info.remoteAddress;
            blockchain.handleIncomingBlock(block);

            return { success: true };
        } catch (error) {
            logger.error(error);
            return { success: false };
        }
    },
    options: {
        plugins: {
            "hapi-ajv": {
                payloadSchema: schema.postBlock,
            },
        },
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
            app.resolvePlugin<P2P.IMonitor>("p2p").broadcastTransactions(guard.getBroadcastTransactions());
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
        plugins: {
            validate: {
                "hapi-ajv": {
                    payloadSchema: schema.postTransactions,
                },
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
            const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
            const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

            const reqBlockHeight = +request.query.lastBlockHeight + 1;
            let blocks = [];

            if (!request.query.lastBlockHeight || isNaN(reqBlockHeight)) {
                blocks.push(blockchain.getLastBlock());
            } else {
                blocks = await databaseService.getBlocks(reqBlockHeight, 400);
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
