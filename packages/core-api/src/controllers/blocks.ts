import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BlockResource, TransactionResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class BlocksController extends Controller {
    @Container.inject(Container.Identifiers.Application)
    protected readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.BlockchainService)
    protected readonly blockchain!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseBlockService)
    protected readonly databaseBlockService!: Contracts.Database.BlockService;

    @Container.inject(Container.Identifiers.DatabaseTransactionService)
    protected readonly databaseTransactionService!: Contracts.Database.TransactionService;

    @Container.inject(Container.Identifiers.StateStore)
    protected readonly stateStore!: Contracts.State.StateStore;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const blockListResult = await this.databaseBlockService.listByCriteria(
            request.query,
            this.getListOrder(request),
            this.getListPage(request),
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
        const block = await this.databaseBlockService.findOneByIdOrHeight(request.params.id);
        if (!block) {
            return Boom.notFound("Block not found");
        }

        return this.respondWithResource(block, BlockResource, request.query.transform);
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const block = await this.databaseBlockService.findOneByIdOrHeight(request.params.id);
            if (!block) {
                return Boom.notFound("Block not found");
            }

            const transactionListResult = await this.databaseTransactionService.listByBlockIdAndCriteria(
                block.id!,
                request.query,
                this.getListOrder(request),
                this.getListPage(request),
            );

            return this.toPagination(transactionListResult, TransactionResource, request.query.transform);
        } catch (error) {
            console.error(error.stack);
            throw error;
        }
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const blockListResult = await this.databaseBlockService.listByCriteria(
            request.payload,
            this.getListOrder(request),
            this.getListPage(request),
        );

        return this.toPagination(blockListResult, BlockResource, request.query.transform);
    }
}
