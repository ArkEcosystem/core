import { app, Contracts } from "@arkecosystem/core-kernel";
import { isBlockChained } from "@arkecosystem/core-utils";
import { Crypto, Interfaces } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { MissingCommonBlockError } from "../../errors";
import { IPeerPingResponse } from "../../interfaces";
import { isWhitelisted } from "../../utils";
import { InvalidTransactionsError, UnchainedBlockError } from "../errors";
import { getPeerConfig } from "../utils/get-peer-config";
import { mapAddr } from "../utils/map-addr";

export const getPeers = ({ service }: { service: Contracts.P2P.IPeerService }): Contracts.P2P.IPeerBroadcast[] => {
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
    const blockchain: Contracts.Blockchain.IBlockchain = app.ioc.get<Contracts.Blockchain.IBlockchain>("blockchain");
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
    const lastBlock: Interfaces.IBlock = app.ioc.get<Contracts.Blockchain.IBlockchain>("blockchain").getLastBlock();

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
    const blockchain: Contracts.Blockchain.IBlockchain = app.ioc.get<Contracts.Blockchain.IBlockchain>("blockchain");

    const block: Interfaces.IBlockData = req.data.block;
    const fromForger: boolean = isWhitelisted(app.ioc.get<any>("p2p.options").remoteAccess, req.headers.remoteAddress);

    if (!fromForger) {
        if (blockchain.pingBlock(block)) {
            return;
        }

        const lastDownloadedBlock: Interfaces.IBlockData = blockchain.getLastDownloadedBlock();

        if (!isBlockChained(lastDownloadedBlock, block)) {
            throw new UnchainedBlockError(lastDownloadedBlock.height, block.height);
        }
    }

    app.ioc
        .get<Contracts.Kernel.Log.ILogger>("log")
        .info(
            `Received new block at height ${block.height.toLocaleString()} with ${pluralize(
                "transaction",
                block.numberOfTransactions,
                true,
            )} from ${mapAddr(req.headers.remoteAddress)}`,
        );

    blockchain.handleIncomingBlock(block, fromForger);
};

export const postTransactions = async ({
    service,
    req,
}: {
    service: Contracts.P2P.IPeerService;
    req;
}): Promise<string[]> => {
    const processor: Contracts.TransactionPool.IProcessor = app.ioc
        .get<Contracts.TransactionPool.IConnection>("transactionPool")
        .makeProcessor();

    const result: Contracts.TransactionPool.IProcessorResult = await processor.validate(req.data.transactions);

    if (result.invalid.length > 0) {
        throw new InvalidTransactionsError();
    }

    if (result.broadcast.length > 0) {
        service.getMonitor().broadcastTransactions(processor.getBroadcastTransactions());
    }

    return result.accept;
};

export const getBlocks = async ({ req }): Promise<Interfaces.IBlockData[] | Contracts.Database.IDownloadBlock[]> => {
    const database: Contracts.Database.IDatabaseService = app.ioc.get<Contracts.Database.IDatabaseService>("database");

    const reqBlockHeight: number = +req.data.lastBlockHeight + 1;
    const reqBlockLimit: number = +req.data.blockLimit || 400;
    const reqHeadersOnly = !!req.data.headersOnly;
    const reqSerialized = !!req.data.serialized; // TODO: remove in 2.6 and only return serialized blocks

    let blocks: Interfaces.IBlockData[] | Contracts.Database.IDownloadBlock[];
    if (reqSerialized) {
        blocks = await database.getBlocksForDownload(reqBlockHeight, reqBlockLimit, reqHeadersOnly);
    } else {
        blocks = await database.getBlocks(reqBlockHeight, reqBlockLimit, reqHeadersOnly);
    }

    app.ioc
        .get<Contracts.Kernel.Log.ILogger>("log")
        .info(
            `${mapAddr(req.headers.remoteAddress)} has downloaded ${pluralize(
                "block",
                blocks.length,
                true,
            )} from height ${reqBlockHeight.toLocaleString()}`,
        );

    return blocks || [];
};
