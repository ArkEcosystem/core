import { Models, Repositories } from "@arkecosystem/core-database";
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

    @Container.inject(Container.Identifiers.BlockRepository)
    protected readonly blockRepository!: Repositories.BlockRepository;

    @Container.inject(Container.Identifiers.DatabaseBlockService)
    protected readonly databaseBlockService!: Contracts.Database.BlockService;

    @Container.inject(Container.Identifiers.DatabaseTransactionService)
    protected readonly databaseTransactionService!: Contracts.Database.TransactionService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const searchResult: Contracts.Database.SearchResult<Contracts.Database.Block> = await this.databaseBlockService.search(
            request.query,
            request.query.orderBy,
            this.paginate(request),
        );

        return this.toPagination(searchResult, BlockResource, request.query.transform);
    }

    public async first(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return super.respondWithResource(
            this.app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).getGenesisBlock().data,
            BlockResource,
            (request.query.transform as unknown) as boolean,
        );
    }

    public async last(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        return super.respondWithResource(
            this.blockchain.getLastBlock().data,
            BlockResource,
            (request.query.transform as unknown) as boolean,
        );
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const block: Models.Block | undefined = await this.blockRepository.findByIdOrHeight(request.params.id);

        if (!block) {
            return Boom.notFound("Block not found");
        }

        return this.respondWithResource(block, BlockResource, request.query.transform);
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const block: Models.Block | undefined = await this.blockRepository.findByIdOrHeight(request.params.id);

        if (!block || !block.id) {
            return Boom.notFound("Block not found");
        }

        const searchResult: Contracts.Database.SearchResult<Contracts.Database.Transaction> = await this.databaseTransactionService.search(
            { ...request.query, blockId: block.id },
            request.query.orderBy,
            this.paginate(request),
        );

        return this.toPagination(searchResult, TransactionResource, request.query.transform);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const searchResult: Contracts.Database.SearchResult<Contracts.Database.Block> = await this.databaseBlockService.search(
            request.payload.criteria,
            request.payload.orderBy,
            this.paginate(request),
        );

        return this.toPagination(searchResult, BlockResource, request.query.transform);
    }
}
