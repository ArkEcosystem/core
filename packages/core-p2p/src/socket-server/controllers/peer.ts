import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Blocks, Crypto, Interfaces, Managers } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { MissingCommonBlockError } from "../../errors";
import { TooManyTransactionsError, UnchainedBlockError } from "../errors";
import { getPeerConfig } from "../utils/get-peer-config";
import { mapAddr } from "../utils/map-addr";
import { Controller } from "./controller";

export class PeerController extends Controller {
    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly peerStorage!: Contracts.P2P.PeerStorage;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly database!: DatabaseService;

    public getPeers(request: Hapi.Request, h: Hapi.ResponseToolkit): Contracts.P2P.PeerBroadcast[] {
        return this.peerStorage
            .getPeers()
            .map((peer) => peer.toBroadcast())
            .sort((a, b) => {
                Utils.assert.defined<number>(a.latency);
                Utils.assert.defined<number>(b.latency);

                return a.latency - b.latency;
            });
    }

    public async getCommonBlocks(
        request: Hapi.Request,
        h: Hapi.ResponseToolkit,
    ): Promise<{
        common: Interfaces.IBlockData;
        lastBlockHeight: number;
    }> {
        const commonBlocks: Interfaces.IBlockData[] = await this.database.getCommonBlocks((request.payload as any).ids);

        if (!commonBlocks.length) {
            throw new MissingCommonBlockError();
        }

        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
        return {
            common: commonBlocks[0],
            lastBlockHeight: blockchain.getLastBlock().data.height,
        };
    }

    public async getStatus(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Contracts.P2P.PeerPingResponse> {
        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
        const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();

        if (!lastBlock) {
            return {
                state: {
                    height: 0,
                    forgingAllowed: false,
                    currentSlot: 0,
                    header: {},
                },
                config: getPeerConfig(this.app),
            };
        }

        const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, lastBlock.data.height);

        const slotInfo = Crypto.Slots.getSlotInfo(blockTimeLookup);

        return {
            state: {
                height: lastBlock.data.height,
                forgingAllowed: slotInfo.forgingStatus,
                currentSlot: slotInfo.slotNumber,
                header: lastBlock.getHeader(),
            },
            config: getPeerConfig(this.app),
        };
    }

    public async postBlock(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<boolean> {
        const configuration = this.app.getTagged<Providers.PluginConfiguration>(
            Container.Identifiers.PluginConfiguration,
            "plugin",
            "@arkecosystem/core-p2p",
        );

        const blockBuffer = Buffer.from(request.payload.block.data);
        const blockHex: string = blockBuffer.toString("hex");

        const deserializedHeader = Blocks.Deserializer.deserialize(blockHex, true);

        if (
            deserializedHeader.data.numberOfTransactions > Managers.configManager.getMilestone().block.maxTransactions
        ) {
            throw new TooManyTransactionsError(deserializedHeader.data);
        }

        const deserialized: {
            data: Interfaces.IBlockData;
            transactions: Interfaces.ITransaction[];
        } = Blocks.Deserializer.deserialize(blockHex);

        const block: Interfaces.IBlockData = {
            ...deserialized.data,
            transactions: deserialized.transactions.map((tx) => tx.data),
        };

        const fromForger: boolean = Utils.isWhitelisted(
            configuration.getOptional<string[]>("remoteAccess", []),
            request.info.remoteAddress,
        );

        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);

        if (!fromForger) {
            if (blockchain.pingBlock(block)) {
                return true;
            }

            const lastDownloadedBlock: Interfaces.IBlockData = blockchain.getLastDownloadedBlock();

            const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, block.height);

            if (!Utils.isBlockChained(lastDownloadedBlock, block, blockTimeLookup)) {
                throw new UnchainedBlockError(lastDownloadedBlock.height, block.height);
            }
        }

        if (
            block.transactions &&
            block.transactions.length > Managers.configManager.getMilestone().block.maxTransactions
        ) {
            throw new TooManyTransactionsError(block);
        }

        this.logger.info(
            `Received new block at height ${block.height.toLocaleString()} with ${Utils.pluralize(
                "transaction",
                block.numberOfTransactions,
                true,
            )} from ${mapAddr(request.info.remoteAddress)}`,
        );

        // TODO: check we don't need to await here (handleIncomingBlock is now an async operation)
        blockchain.handleIncomingBlock(block, fromForger);
        return true;
    }

    public async postTransactions(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<string[]> {
        const createProcessor: Contracts.TransactionPool.ProcessorFactory = this.app.get(
            Container.Identifiers.TransactionPoolProcessorFactory,
        );
        const processor: Contracts.TransactionPool.Processor = createProcessor();
        await processor.process((request.payload as any).transactions);
        return processor.accept;
    }

    public async getBlocks(
        request: Hapi.Request,
        h: Hapi.ResponseToolkit,
    ): Promise<Interfaces.IBlockData[] | Contracts.Shared.DownloadBlock[]> {
        const reqBlockHeight: number = +(request.payload as any).lastBlockHeight + 1;
        const reqBlockLimit: number = +(request.payload as any).blockLimit || 400;
        const reqHeadersOnly: boolean = !!(request.payload as any).headersOnly;

        const blocks: Contracts.Shared.DownloadBlock[] = await this.database.getBlocksForDownload(
            reqBlockHeight,
            reqBlockLimit,
            reqHeadersOnly,
        );

        this.logger.info(
            `${mapAddr(request.info.remoteAddress)} has downloaded ${Utils.pluralize(
                "block",
                blocks.length,
                true,
            )} from height ${reqBlockHeight.toLocaleString()}`,
        );

        return blocks;
    }
}
