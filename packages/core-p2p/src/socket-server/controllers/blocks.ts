import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Providers, Utils } from "@arkecosystem/core-kernel";
import { Blocks, Interfaces, Managers } from "@arkecosystem/crypto";
import Hapi from "@hapi/hapi";

import { constants } from "../../constants";
import { TooManyTransactionsError } from "../errors";
import { mapAddr } from "../utils/map-addr";
import { Controller } from "./controller";

export class BlocksController extends Controller {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-p2p")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseService)
    private readonly database!: DatabaseService;

    public async postBlock(
        request: Hapi.Request,
        h: Hapi.ResponseToolkit,
    ): Promise<{ status: boolean; height: number }> {
        const blockBuffer: Buffer = request.payload.block;

        const deserializedHeader = Blocks.Deserializer.deserialize(blockBuffer, true);

        if (
            deserializedHeader.data.numberOfTransactions > Managers.configManager.getMilestone().block.maxTransactions
        ) {
            throw new TooManyTransactionsError(deserializedHeader.data);
        }

        const deserialized: {
            data: Interfaces.IBlockData;
            transactions: Interfaces.ITransaction[];
        } = Blocks.Deserializer.deserialize(blockBuffer);

        const block: Interfaces.IBlockData = {
            ...deserialized.data,
            transactions: deserialized.transactions.map((tx) => tx.data),
        };

        const fromForger: boolean = Utils.isWhitelisted(
            this.configuration.getOptional<string[]>("remoteAccess", []),
            request.info.remoteAddress,
        );

        if (!fromForger) {
            if (this.blockchain.pingBlock(block)) {
                return { status: true, height: this.blockchain.getLastHeight() };
            }

            const lastDownloadedBlock: Interfaces.IBlockData = this.blockchain.getLastDownloadedBlock();

            const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, block.height);

            if (!Utils.isBlockChained(lastDownloadedBlock, block, blockTimeLookup)) {
                return { status: false, height: this.blockchain.getLastHeight() };
            }
        }

        this.logger.info(
            `Received new block at height ${block.height.toLocaleString()} with ${Utils.pluralize(
                "transaction",
                block.numberOfTransactions,
                true,
            )} from ${mapAddr(request.info.remoteAddress)}`,
        );

        await this.blockchain.handleIncomingBlock(block, fromForger);

        return { status: true, height: this.blockchain.getLastHeight() };
    }

    public async getBlocks(
        request: Hapi.Request,
        h: Hapi.ResponseToolkit,
    ): Promise<Interfaces.IBlockData[] | Contracts.Shared.DownloadBlock[]> {
        const reqBlockHeight: number = +(request.payload as any).lastBlockHeight + 1;
        const reqBlockLimit: number = +(request.payload as any).blockLimit || 400;
        const reqHeadersOnly: boolean = !!(request.payload as any).headersOnly;

        const lastHeight: number = this.blockchain.getLastHeight();
        if (reqBlockHeight > lastHeight) {
            return [];
        }

        const blocks: Contracts.Shared.DownloadBlock[] = await this.database.getBlocksForDownload(
            reqBlockHeight,
            reqBlockLimit,
            reqHeadersOnly,
        );

        // Only return the blocks fetched while we are below the p2p maxPayload limit
        const blocksToReturn: Contracts.Shared.DownloadBlock[] = [];
        const maxPayloadWithMargin = constants.DEFAULT_MAX_PAYLOAD - 100 * 1024; // 100KB margin because we're dealing with estimates
        for (let i = 0, sizeEstimate = 0; sizeEstimate < maxPayloadWithMargin && i < blocks.length; i++) {
            blocksToReturn.push(blocks[i]);
            sizeEstimate += blocks[i].transactions?.reduce((acc, curr) => acc + curr.length, 0) ?? 0;
            // We estimate the size of each block -- as it will be sent through p2p -- with the length of the
            // associated transactions. When blocks are big, size of the block header is negligible compared to its
            // transactions. And here we just want a broad limit to stop when getting close to p2p max payload.
        }

        this.logger.info(
            `${mapAddr(request.info.remoteAddress)} has downloaded ${Utils.pluralize(
                "block",
                blocksToReturn.length,
                true,
            )} from height ${reqBlockHeight.toLocaleString()}`,
        );

        return blocksToReturn;
    }
}
