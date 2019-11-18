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

    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly databaseService!: Contracts.Database.DatabaseService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const blocks = await this.databaseService.blocksBusinessRepository.search({
            ...request.query,
            ...this.paginate(request),
        });

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
        const block = await this.databaseService.blocksBusinessRepository.findByIdOrHeight(request.params.id);

        if (!block) {
            return Boom.notFound("Block not found");
        }

        return this.respondWithResource(block, BlockResource, request.query.transform);
    }

    public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const block = await this.databaseService.blocksBusinessRepository.findByIdOrHeight(request.params.id);

        if (!block || !block.id) {
            return Boom.notFound("Block not found");
        }

        const rows = await this.databaseService.transactionsBusinessRepository.findAllByBlock(block.id, {
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(rows, TransactionResource, request.query.transform);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const blocks = await this.databaseService.blocksBusinessRepository.search({
            ...request.payload,
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(blocks, BlockResource, request.query.transform);
    }
}
