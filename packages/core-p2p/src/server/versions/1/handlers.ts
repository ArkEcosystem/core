import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app } from "@arkecosystem/core-kernel";
import { TransactionGuard } from "@arkecosystem/core-transaction-pool";
import { Joi, models, slots } from "@arkecosystem/crypto";

import pluralize from "pluralize";
import { monitor } from "../../../monitor";

const { Block } = models;

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
        const lastBlock = app.blockchain.getLastBlock();

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

        const ids = request.query.ids
            .split(",")
            .slice(0, 9)
            .filter(id => id.match(/^\d+$/));

        try {
            const commonBlocks = await app.blockchain.database.getCommonBlocks(ids);

            return {
                success: true,
                common: commonBlocks.length ? commonBlocks[0] : null,
                lastBlockHeight: app.blockchain.getLastBlock().data.height,
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
        const lastBlock = app.blockchain.getLastBlock();

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
        try {
            if (!request.payload || !request.payload.block) {
                return { success: false };
            }

            const block = request.payload.block;

            if (app.blockchain.pingBlock(block)) {
                return { success: true };
            }
            // already got it?
            const lastDownloadedBlock = app.blockchain.getLastDownloadedBlock();

            // Are we ready to get it?
            if (lastDownloadedBlock && lastDownloadedBlock.data.height + 1 !== block.height) {
                return { success: true };
            }

            const b = new Block(block);

            if (!b.verification.verified) {
                return { success: false };
            }

            app.blockchain.pushPingBlock(b.data);

            block.ip = request.info.remoteAddress;
            app.blockchain.handleIncomingBlock(block);

            return { success: true };
        } catch (error) {
            app.logger.error(error);
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
        if (!app.transactionPool) {
            return {
                success: false,
                message: "Transaction pool not available",
            };
        }

        const guard = new TransactionGuard(app.transactionPool);

        const result = await guard.validate(request.payload.transactions);

        if (result.invalid.length > 0) {
            return {
                success: false,
                message: "Transactions list is not conform",
                error: "Transactions list is not conform",
            };
        }

        if (result.broadcast.length > 0) {
            app.p2p.broadcastTransactions(guard.getBroadcastTransactions());
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
                transactions: Joi.transactionArray()
                    .min(1)
                    .max(app.config("transactionPool").maxTransactionsPerRequest)
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
            const database = app.resolve<PostgresConnection>("database");

            const reqBlockHeight = +request.query.lastBlockHeight + 1;
            let blocks = [];

            if (!request.query.lastBlockHeight || isNaN(reqBlockHeight)) {
                blocks.push(app.blockchain.getLastBlock());
            } else {
                blocks = await database.getBlocks(reqBlockHeight, 400);
            }

            app.logger.info(
                `${request.info.remoteAddress} has downloaded ${pluralize(
                    "block",
                    blocks.length,
                    true,
                )} from height ${(!isNaN(reqBlockHeight) ? reqBlockHeight : blocks[0].data.height).toLocaleString()}`,
            );

            return { success: true, blocks: blocks || [] };
        } catch (error) {
            app.logger.error(error.stack);

            return h.response({ success: false, error }).code(500);
        }
    },
};
