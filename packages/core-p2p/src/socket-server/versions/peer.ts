import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Blocks, Crypto, Interfaces, Managers } from "@arkecosystem/crypto";

import { PeerService } from "../../contracts";
import { MissingCommonBlockError } from "../../errors";
import { isWhitelisted } from "../../utils";
import { TooManyTransactionsError, UnchainedBlockError } from "../errors";
import { getPeerConfig } from "../utils/get-peer-config";
import { mapAddr } from "../utils/map-addr";

// todo: review the implementation of all methods

export const getPeers = ({ service }: { service: PeerService }): Contracts.P2P.PeerBroadcast[] => {
    return service.storage
        .getPeers()
        .map(peer => peer.toBroadcast())
        .sort((a, b) => {
            Utils.assert.defined<number>(a.latency);
            Utils.assert.defined<number>(b.latency);

            return a.latency - b.latency;
        });
};

export const getCommonBlocks = async ({
    app,
    req,
}: {
    app: Contracts.Kernel.Application;
    req: any;
}): Promise<{
    common: Interfaces.IBlockData;
    lastBlockHeight: number;
}> => {
    const blockchain: Contracts.Blockchain.Blockchain = app.get<Contracts.Blockchain.Blockchain>(
        Container.Identifiers.BlockchainService,
    );

    const database: DatabaseService = app.get<DatabaseService>(Container.Identifiers.DatabaseService);

    const commonBlocks: Interfaces.IBlockData[] = await database.getCommonBlocks(req.data.ids);

    if (!commonBlocks.length) {
        throw new MissingCommonBlockError();
    }

    return {
        common: commonBlocks[0],
        lastBlockHeight: blockchain.getLastBlock().data.height,
    };
};

export const getStatus = async ({
    app,
}: {
    app: Contracts.Kernel.Application;
}): Promise<Contracts.P2P.PeerPingResponse> => {
    const lastBlock: Interfaces.IBlock = app
        .get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService)
        .getLastBlock();

    return {
        state: {
            height: lastBlock ? lastBlock.data.height : 0,
            forgingAllowed: Crypto.Slots.isForgingAllowed(),
            currentSlot: Crypto.Slots.getSlotNumber(),
            header: lastBlock ? lastBlock.getHeader() : {},
        },
        config: getPeerConfig(app),
    };
};

export const postBlock = async ({ app, req }: { app: Contracts.Kernel.Application; req: any }): Promise<void> => {
    const configuration = app.getTagged<Providers.PluginConfiguration>(
        Container.Identifiers.PluginConfiguration,
        "plugin",
        "@arkecosystem/core-p2p",
    );
    const blockchain: Contracts.Blockchain.Blockchain = app.get<Contracts.Blockchain.Blockchain>(
        Container.Identifiers.BlockchainService,
    );

    const blockHex: string = (req.data.block as Buffer).toString("hex");

    const deserializedHeader = Blocks.Deserializer.deserialize(blockHex, true);

    if (deserializedHeader.data.numberOfTransactions > Managers.configManager.getMilestone().block.maxTransactions) {
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

    const fromForger: boolean = isWhitelisted(
        configuration.getOptional<string[]>("remoteAccess", []),
        req.headers.remoteAddress,
    );

    if (!fromForger) {
        if (blockchain.pingBlock(block)) {
            return;
        }

        const lastDownloadedBlock: Interfaces.IBlockData = blockchain.getLastDownloadedBlock();

        if (!Utils.isBlockChained(lastDownloadedBlock, block)) {
            throw new UnchainedBlockError(lastDownloadedBlock.height, block.height);
        }
    }

    if (block.transactions && block.transactions.length > Managers.configManager.getMilestone().block.maxTransactions) {
        throw new TooManyTransactionsError(block);
    }

    app.log.info(
        `Received new block at height ${block.height.toLocaleString()} with ${Utils.pluralize(
            "transaction",
            block.numberOfTransactions,
            true,
        )} from ${mapAddr(req.headers.remoteAddress)}`,
    );

    blockchain.handleIncomingBlock(block, fromForger);
};

export const postTransactions = async ({
    app,
    req,
}: {
    app: Contracts.Kernel.Application;
    req: any;
}): Promise<string[]> => {
    const createProcessor: Contracts.TransactionPool.ProcessorFactory = app.get(
        Container.Identifiers.TransactionPoolProcessorFactory,
    );
    const processor: Contracts.TransactionPool.Processor = createProcessor();
    await processor.process(req.data.transactions);
    return processor.accept;
};

export const getBlocks = async ({
    app,
    req,
}: {
    app: Contracts.Kernel.Application;
    req: any;
}): Promise<Interfaces.IBlockData[] | Contracts.Shared.DownloadBlock[]> => {
    const database: DatabaseService = app.get<DatabaseService>(Container.Identifiers.DatabaseService);

    const reqBlockHeight: number = +req.data.lastBlockHeight + 1;
    const reqBlockLimit: number = +req.data.blockLimit || 400;
    const reqHeadersOnly: boolean = !!req.data.headersOnly;

    const blocks: Contracts.Shared.DownloadBlock[] = await database.getBlocksForDownload(
        reqBlockHeight,
        reqBlockLimit,
        reqHeadersOnly,
    );

    app.log.info(
        `${mapAddr(req.headers.remoteAddress)} has downloaded ${Utils.pluralize(
            "block",
            blocks.length,
            true,
        )} from height ${reqBlockHeight.toLocaleString()}`,
    );

    return blocks;
};
