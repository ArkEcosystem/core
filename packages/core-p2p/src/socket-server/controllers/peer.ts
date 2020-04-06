import Hapi from "@hapi/hapi";
import { Container, Contracts, Utils, Providers } from "@arkecosystem/core-kernel";

import { Controller } from "./controller";
import { DatabaseService } from "@arkecosystem/core-database";
import { Interfaces, Crypto, Blocks, Managers } from "@arkecosystem/crypto";
import { MissingCommonBlockError } from "../../errors";
import { getPeerConfig } from "../utils/get-peer-config";
import { TooManyTransactionsError, UnchainedBlockError } from "../errors";
import { isWhitelisted } from "../../utils";
import { mapAddr } from "../utils/map-addr";

export class PeerController extends Controller {
    @Container.inject(Container.Identifiers.PeerStorage)
    private readonly peerStorage!: Contracts.P2P.PeerStorage;

    @Container.inject(Container.Identifiers.PeerProcessor)
    private readonly peerProcessor!: Contracts.P2P.PeerProcessor;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly database!: DatabaseService;
    
    public getPeers(request: Hapi.Request, h: Hapi.ResponseToolkit): Contracts.P2P.PeerBroadcast[] {
        // Add the peer if not already (on every peer endpoint)
        this.peerProcessor.validateAndAcceptPeer({ ip: request.info.remoteAddress } as Contracts.P2P.Peer);

        return this.peerStorage.getPeers()
            .map(peer => peer.toBroadcast())
            .sort((a, b) => {
                Utils.assert.defined<number>(a.latency);
                Utils.assert.defined<number>(b.latency);

                return a.latency - b.latency;
            });
    }

    public async getCommonBlocks(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<{
        common: Interfaces.IBlockData;
        lastBlockHeight: number;
    }> {
        // Add the peer if not already (on every peer endpoint)
        this.peerProcessor.validateAndAcceptPeer({ ip: request.info.remoteAddress } as Contracts.P2P.Peer);

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
        // Add the peer if not already (on every peer endpoint)
        this.peerProcessor.validateAndAcceptPeer({ ip: request.info.remoteAddress } as Contracts.P2P.Peer);

        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
        const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();

        return {
            state: {
                height: lastBlock ? lastBlock.data.height : 0,
                forgingAllowed: Crypto.Slots.isForgingAllowed(),
                currentSlot: Crypto.Slots.getSlotNumber(),
                header: lastBlock ? lastBlock.getHeader() : {},
            },
            config: getPeerConfig(this.app),
        };
    }

    public postBlock(request: Hapi.Request, h: Hapi.ResponseToolkit): boolean {
        // Add the peer if not already (on every peer endpoint)
        this.peerProcessor.validateAndAcceptPeer({ ip: request.info.remoteAddress } as Contracts.P2P.Peer);

        this.logger.debug(`postBlock request.info received: ${JSON.stringify(request.info)}`)
        this.logger.debug(`postBlock request.headers received: ${JSON.stringify(request.headers)}`)
        const configuration = this.app.getTagged<Providers.PluginConfiguration>(
            Container.Identifiers.PluginConfiguration,
            "plugin",
            "@arkecosystem/core-p2p",
        );

        const blockBuffer = Buffer.from(request.payload.block.data);
        const blockHex: string = blockBuffer.toString("hex");
    
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
            request.info.remoteAddress,
        );

        const blockchain = this.app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
    
        if (!fromForger) {
            if (blockchain.pingBlock(block)) {
                return true;
            }
    
            const lastDownloadedBlock: Interfaces.IBlockData = blockchain.getLastDownloadedBlock();
    
            if (!Utils.isBlockChained(lastDownloadedBlock, block)) {
                throw new UnchainedBlockError(lastDownloadedBlock.height, block.height);
            }
        }
    
        if (block.transactions && block.transactions.length > Managers.configManager.getMilestone().block.maxTransactions) {
            throw new TooManyTransactionsError(block);
        }
    
        this.logger.info(
            `Received new block at height ${block.height.toLocaleString()} with ${Utils.pluralize(
                "transaction",
                block.numberOfTransactions,
                true,
            )} from ${request.info.remoteAddress} (${request.headers.host})`,
        );
    
        blockchain.handleIncomingBlock(block, fromForger);
        return true;
    }

    public async postTransactions(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<string[]> {
        // Add the peer if not already (on every peer endpoint)
        this.peerProcessor.validateAndAcceptPeer({ ip: request.info.remoteAddress } as Contracts.P2P.Peer);

        const createProcessor: Contracts.TransactionPool.ProcessorFactory = this.app.get(
            Container.Identifiers.TransactionPoolProcessorFactory,
        );
        const processor: Contracts.TransactionPool.Processor = createProcessor();
        await processor.process((request.payload as any).transactions);
        return processor.accept;
    }

    public async getBlocks(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<Interfaces.IBlockData[] | Contracts.Shared.DownloadBlock[]> {
        // Add the peer if not already (on every peer endpoint)
        this.peerProcessor.validateAndAcceptPeer({ ip: request.info.remoteAddress } as Contracts.P2P.Peer);

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
