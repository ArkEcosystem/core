import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, Logger, P2P, TransactionPool } from "@arkecosystem/core-interfaces";
import { TransactionGuard } from "@arkecosystem/core-transaction-pool";
import { Blocks, Crypto } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { InvalidBlockReceivedError, InvalidTransactionsError, MissingTransactionIdsError } from "../../errors";
import { validate } from "../../utils/validate";
import { schema } from "./schema";

const { Block } = Blocks;

const transactionPool = app.resolvePlugin<TransactionPool.IConnection>("transaction-pool");
const logger = app.resolvePlugin<Logger.ILogger>("logger");

export async function acceptNewPeer({ service, req }: { service: P2P.IPeerService; req }) {
    const peer = { ip: req.data.ip };

    const requiredHeaders = ["nethash", "version", "port", "os"];

    requiredHeaders.forEach(key => {
        peer[key] = req.headers[key];
    });

    await service.getProcessor().validateAndAcceptPeer(peer);
}

export const getPeers = ({ service }: { service: P2P.IPeerService }) => {
    const peers = service
        .getStorage()
        .getPeers()
        .map(peer => peer.toBroadcast())
        .sort((a, b) => a.latency - b.latency);

    return peers;
};

export async function getCommonBlocks({ req }) {
    if (!req.data.ids) {
        throw new MissingTransactionIdsError();
    }

    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const ids = req.data.ids.slice(0, 9).filter(id => id.match(/^\d+$/));

    const commonBlocks = await blockchain.database.getCommonBlocks(ids);

    return {
        common: commonBlocks.length ? commonBlocks[0] : null,
        lastBlockHeight: blockchain.getLastBlock().data.height,
    };
}

export const getStatus = () => {
    const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

    return {
        height: lastBlock ? lastBlock.data.height : 0,
        forgingAllowed: Crypto.slots.isForgingAllowed(),
        currentSlot: Crypto.slots.getSlotNumber(),
        header: lastBlock ? lastBlock.getHeader() : {},
    };
};

export const postBlock = ({ req }) => {
    validate(schema.postBlock, req.data);

    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const block = req.data.block;

    if (blockchain.pingBlock(block)) {
        return;
    }

    // already got it?
    const lastDownloadedBlock = blockchain.getLastDownloadedBlock();

    // Are we ready to get it?
    if (lastDownloadedBlock && lastDownloadedBlock.data.height + 1 !== block.height) {
        return;
    }

    const b = Block.fromData(block);

    if (!b.verification.verified) {
        throw new InvalidBlockReceivedError(b.data);
    }

    blockchain.pushPingBlock(b.data);

    block.ip = req.headers.remoteAddress;
    blockchain.handleIncomingBlock(block);
};

export async function postTransactions({ service, req }: { service: P2P.IPeerService; req }) {
    validate(schema.postTransactions, req.data);

    const guard = new TransactionGuard(transactionPool);

    const result = await guard.validate(req.data.transactions);

    if (result.invalid.length > 0) {
        throw new InvalidTransactionsError();
    }

    if (result.broadcast.length > 0) {
        service.getMonitor().broadcastTransactions(guard.getBroadcastTransactions());
    }

    return result.accept;
}

export async function getBlocks({ req }) {
    const database = app.resolvePlugin<Database.IDatabaseService>("database");
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const reqBlockHeight = +req.data.lastBlockHeight + 1;
    let blocks = [];

    if (!req.data.lastBlockHeight || isNaN(reqBlockHeight)) {
        const lastBlock = blockchain.getLastBlock();

        if (lastBlock) {
            blocks.push(lastBlock.data);
        }
    } else {
        blocks = await database.getBlocks(reqBlockHeight, 400);
    }

    logger.info(
        `${req.headers.remoteAddress} has downloaded ${pluralize("block", blocks.length, true)} from height ${(!isNaN(
            reqBlockHeight,
        )
            ? reqBlockHeight
            : blocks[0].height
        ).toLocaleString()}`,
    );

    return { blocks };
}
