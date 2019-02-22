import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, Logger, P2P } from "@arkecosystem/core-interfaces";
import { TransactionGuard, TransactionPool } from "@arkecosystem/core-transaction-pool";
import { models, slots } from "@arkecosystem/crypto";

import pluralize from "pluralize";
import { monitor } from "../../../monitor";

const { Block } = models;

const transactionPool = app.resolvePlugin<TransactionPool>("transactionPool");
const logger = app.resolvePlugin<Logger.ILogger>("logger");

export const acceptNewPeer = async req => {
    const requiredHeaders = ["nethash", "version", "port", "os"];

    const peer = { ip: req.data.ip };

    requiredHeaders.forEach(key => {
        peer[key] = req.headers[key];
    });

    await monitor.acceptNewPeer(peer);
};

export const getPeers = () => {
    const peers = monitor
        .getPeers()
        .map(peer => peer.toBroadcastInfo())
        .sort((a, b) => a.delay - b.delay);

    return {
        success: true,
        peers,
    };
};

export const getHeight = () => {
    const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

    return {
        success: true,
        height: lastBlock.data.height,
        id: lastBlock.data.id,
    };
};

export const getCommonBlocks = async req => {
    if (!req.data.ids) {
        return {
            success: false,
        };
    }

    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const ids = req.data.ids.slice(0, 9).filter(id => id.match(/^\d+$/));

    const commonBlocks = await blockchain.database.getCommonBlocks(ids);

    return {
        success: true,
        common: commonBlocks.length ? commonBlocks[0] : null,
        lastBlockHeight: blockchain.getLastBlock().data.height,
    };
};

export const getTransactions = () => {
    return { success: true, transactions: [] };
};

export const getStatus = () => {
    const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

    return {
        success: true,
        height: lastBlock ? lastBlock.data.height : 0,
        forgingAllowed: slots.isForgingAllowed(),
        currentSlot: slots.getSlotNumber(),
        header: lastBlock ? lastBlock.getHeader() : {},
    };
};

export const postBlock = req => {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    if (!req.data || !req.data.block) {
        return { success: false };
    }

    const block = req.data.block;

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

    block.ip = req.headers.remoteAddress;
    blockchain.handleIncomingBlock(block);

    return { success: true };
};

export const postTransactions = async req => {
    if (!transactionPool) {
        return {
            success: false,
            message: "Transaction pool not available",
        };
    }

    const guard = new TransactionGuard(transactionPool);

    const result = await guard.validate(req.data.transactions);

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
    /*options: {
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
    },*/
};

export const getBlocks = async req => {
    const database = app.resolvePlugin<Database.IDatabaseService>("database");
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const reqBlockHeight = +req.data.lastBlockHeight + 1;
    let blocks = [];

    if (!req.data.lastBlockHeight || isNaN(reqBlockHeight)) {
        const lastBlock = blockchain.getLastBlock();
        if (lastBlock) {
            blocks.push(lastBlock.data); // lastBlock is a Block, we want its data
        }
    } else {
        blocks = await database.getBlocks(reqBlockHeight, 400);
    }

    logger.info(
        `${req.headers.remoteAddress} has downloaded ${pluralize("block", blocks.length, true)} from height ${(!isNaN(
            reqBlockHeight,
        )
            ? reqBlockHeight
            : blocks[0].data.height
        ).toLocaleString()}`,
    );

    return { success: true, blocks: blocks || [] };
};
