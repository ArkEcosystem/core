import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, Logger, P2P, TransactionPool } from "@arkecosystem/core-interfaces";
import { isBlockChained } from "@arkecosystem/core-utils";
import { Blocks, Crypto, Interfaces } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { MissingCommonBlockError } from "../../errors";
import { IPeerPingResponse } from "../../interfaces";
import { isWhitelisted } from "../../utils";
import { InvalidTransactionsError, TooManyTransactionsError, UnchainedBlockError } from "../errors";
import { getPeerConfig } from "../utils/get-peer-config";
import { mapAddr } from "../utils/map-addr";

export const getPeers = ({ service }: { service: P2P.IPeerService }): P2P.IPeerBroadcast[] => {
    return service
        .getStorage()
        .getPeers()
        .map(peer => peer.toBroadcast())
        .sort((a, b) => a.latency - b.latency);
};

export const getCommonBlocks = async ({
    req,
}): Promise<{
    common: Interfaces.IBlockData;
    lastBlockHeight: number;
}> => {
    const blockchain: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const commonBlocks: Interfaces.IBlockData[] = await blockchain.database.getCommonBlocks(req.data.ids);

    if (!commonBlocks.length) {
        throw new MissingCommonBlockError();
    }

    return {
        common: commonBlocks[0],
        lastBlockHeight: blockchain.getLastBlock().data.height,
    };
};

export const getStatus = async (): Promise<IPeerPingResponse> => {
    const lastBlock: Interfaces.IBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

    return {
        state: {
            height: lastBlock ? lastBlock.data.height : 0,
            forgingAllowed: Crypto.Slots.isForgingAllowed(),
            currentSlot: Crypto.Slots.getSlotNumber(),
            header: lastBlock ? lastBlock.getHeader() : {},
        },
        config: getPeerConfig(),
    };
};

export const postBlock = async ({ req }): Promise<void> => {
    const blockchain: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const blockHex: string = (req.data.block as Buffer).toString("hex");

    const deserializedHeader = Blocks.Deserializer.deserialize(blockHex, true);

    if (deserializedHeader.data.numberOfTransactions > app.getConfig().getMilestone().block.maxTransactions) {
        throw new TooManyTransactionsError(deserializedHeader.data);
    }

    const deserialized: {
        data: Interfaces.IBlockData;
        transactions: Interfaces.ITransaction[];
    } = Blocks.Deserializer.deserialize(blockHex);

    const block: Interfaces.IBlockData = {
        ...deserialized.data,
        transactions: deserialized.transactions.map(tx => tx.data),
    };

    const fromForger: boolean = isWhitelisted(app.resolveOptions("p2p").remoteAccess, req.headers.remoteAddress);

    if (!fromForger) {
        if (blockchain.pingBlock(block)) {
            return;
        }

        const lastDownloadedBlock: Interfaces.IBlockData = blockchain.getLastDownloadedBlock();

        if (!isBlockChained(lastDownloadedBlock, block)) {
            throw new UnchainedBlockError(lastDownloadedBlock.height, block.height);
        }
    }

    if (block.transactions.length > app.getConfig().getMilestone().block.maxTransactions) {
        throw new TooManyTransactionsError(block);
    }

    app.resolvePlugin<Logger.ILogger>("logger").info(
        `Received new block at height ${block.height.toLocaleString()} with ${pluralize(
            "transaction",
            block.numberOfTransactions,
            true,
        )} from ${mapAddr(req.headers.remoteAddress)}`,
    );

    blockchain.handleIncomingBlock(block, fromForger);
};

export const postTransactions = async ({ service, req }: { service: P2P.IPeerService; req }): Promise<string[]> => {
    const processor: TransactionPool.IProcessor = app
        .resolvePlugin<TransactionPool.IConnection>("transaction-pool")
        .makeProcessor();

    const result: TransactionPool.IProcessorResult = await processor.validate(req.data.transactions);

    if (result.invalid.length > 0) {
        throw new InvalidTransactionsError();
    }

    if (result.broadcast.length > 0) {
        service.getMonitor().broadcastTransactions(processor.getBroadcastTransactions());
    }

    return result.accept;
};

export const getBlocks = async ({ req }): Promise<Interfaces.IBlockData[] | Database.IDownloadBlock[]> => {
    const database: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const reqBlockHeight: number = +req.data.lastBlockHeight + 1;
    const reqBlockLimit: number = +req.data.blockLimit || 400;
    const reqHeadersOnly: boolean = !!req.data.headersOnly;

    const blocks: Database.IDownloadBlock[] = await database.getBlocksForDownload(
        reqBlockHeight,
        reqBlockLimit,
        reqHeadersOnly,
    );

    app.resolvePlugin<Logger.ILogger>("logger").info(
        `${mapAddr(req.headers.remoteAddress)} has downloaded ${pluralize(
            "block",
            blocks.length,
            true,
        )} from height ${reqBlockHeight.toLocaleString()}`,
    );

    return blocks;
};
