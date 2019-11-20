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

    @Container.inject(Container.Identifiers.TransactionRepository)
    protected readonly transactionRepository!: Repositories.TransactionRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const blocks: Repositories.RepositorySearchResult<Models.Block> = await this.blockRepository.searchByQuery(
            request.query,
            this.paginate(request),
        );

        return this.toPagination(blocks, BlockResource, request.query.transform);
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

        const rows: Repositories.RepositorySearchResult<Models.Transaction> = await this.transactionRepository.searchByQuery(
            {
                blockId: block.id,
                ...request.query,
            },
            this.paginate(request),
        );

        return this.toPagination(rows, TransactionResource, request.query.transform);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const blocks = await this.blockRepository.search({
            ...request.query, // only for orderBy
            ...request.payload,
            ...this.paginate(request),
        });

        return this.toPagination(blocks, BlockResource, request.query.transform);
    }
}
