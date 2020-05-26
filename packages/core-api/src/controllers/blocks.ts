import { Interfaces } from "@arkecosystem/core-crypto";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BlockResource, TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class BlocksController extends Controller {
    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.BlockHistoryService)
    private readonly blockHistoryService!: Contracts.Shared.BlockHistoryService;

    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const blockListResult = await this.blockHistoryService.listByCriteria(
            request.query,
            this.getListingOrder(request),
            this.getListingPage(request),
            this.getListingOptions(),
        );

        return this.toPagination(blockListResult, BlockResource, request.query.transform);
    }

    public async first(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const block = this.stateStore.getGenesisBlock().data;
        return super.respondWithResource(block, BlockResource, request.query.transform);
    }

    public async last(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const block = this.blockchain.getLastBlock().data;
        return super.respondWithResource(block, BlockResource, request.query.transform);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const block = await this.findBlockByIdOrHeight(request.params.id);
        if (!block) {
            return Boom.notFound("Block not found");
        }
        return this.respondWithResource(block, BlockResource, request.query.transform);
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const block = await this.findBlockByIdOrHeight(request.params.id);
        if (!block) {
            return Boom.notFound("Block not found");
        }

        const criteria = { ...request.query, blockId: block.id! };
        const transactionListResult = await this.transactionHistoryService.listByCriteria(
            criteria,
            this.getListingOrder(request),
            this.getListingPage(request),
            this.getListingOptions(),
        );

        return this.toPagination(transactionListResult, TransactionResource, request.query.transform);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const blockListResult = await this.blockHistoryService.listByCriteria(
            request.payload,
            this.getListingOrder(request),
            this.getListingPage(request),
            this.getListingOptions(),
        );

        return this.toPagination(blockListResult, BlockResource, request.query.transform);
    }

    private findBlockByIdOrHeight(idOrHeight: string): Promise<Interfaces.IBlockData | undefined> {
        const asHeight = parseFloat(idOrHeight);

        if (asHeight && asHeight <= this.blockchain.getLastHeight()) {
            return this.blockHistoryService.findOneByCriteria({ height: asHeight });
        } else {
            return this.blockHistoryService.findOneByCriteria({ id: idOrHeight });
        }
    }
}
