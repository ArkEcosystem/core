import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, Logger, P2P, TransactionPool } from "@arkecosystem/core-interfaces";
import { isBlockChained } from "@arkecosystem/core-utils";
import { Crypto, Interfaces } from "@arkecosystem/crypto";
import pluralize from "pluralize";
import { MissingCommonBlockError } from "../../errors";
import { IPeerPingResponse } from "../../interfaces";
import { isWhitelisted } from "../../utils";
import { InvalidTransactionsError, UnchainedBlockError } from "../errors";
import { getPeerConfig } from "../utils/get-peer-config";

export const acceptNewPeer = async ({ service, req }: { service: P2P.IPeerService; req }): Promise<void> => {
    await service.getProcessor().validateAndAcceptPeer({ ip: req.data.ip });
};

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

    const block: Interfaces.IBlockData = req.data.block;
    const fromForger: boolean = isWhitelisted(app.resolveOptions("p2p").remoteAccess, req.headers.remoteAddress);

    if (!fromForger) {
        if (blockchain.pingBlock(block)) {
            return;
        }

        const lastDownloadedBlock: Interfaces.IBlock = blockchain.getLastDownloadedBlock();

        if (!isBlockChained(lastDownloadedBlock.data, block)) {
            throw new UnchainedBlockError(lastDownloadedBlock.data.height, block.height);
        }
    }

    blockchain.handleIncomingBlock(block, req.headers.remoteAddress, fromForger);
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

export const getBlocks = async ({ req }): Promise<Interfaces.IBlockData[]> => {
    const database: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    const blockchain: Blockchain.IBlockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const reqBlockHeight: number = +req.data.lastBlockHeight + 1;
    let blocks: Interfaces.IBlockData[] = [];

    if (!req.data.lastBlockHeight || isNaN(reqBlockHeight)) {
        const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();

        if (lastBlock) {
            blocks.push(lastBlock.data);
        }
    } else {
        blocks = await database.getBlocks(reqBlockHeight, 400);
    }

    app.resolvePlugin<Logger.ILogger>("logger").info(
        `${req.headers.remoteAddress} has downloaded ${pluralize("block", blocks.length, true)} from height ${(!isNaN(
            reqBlockHeight,
        )
            ? reqBlockHeight
            : blocks[0].height
        ).toLocaleString()}`,
    );

    return blocks || [];
};
