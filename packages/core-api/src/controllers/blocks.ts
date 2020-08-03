import { Container } from "@arkecosystem/core-kernel";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    BlockCriteria,
    BlockResourceDbProvider,
    BlockResourceStateProvider,
    SomeBlockResource,
    SomeBlockResourcesPage,
    SomeTransactionResourcesPage,
    TransactionResourceDbProvider,
} from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class BlocksController extends Controller {
    @Container.inject(Identifiers.BlockResourceDbProvider)
    private readonly blockResourceDbProvider!: BlockResourceDbProvider;

    @Container.inject(Identifiers.BlockResourceStateProvider)
    private readonly blockResourceStateProvider!: BlockResourceStateProvider;

    @Container.inject(Identifiers.TransactionResourceDbProvider)
    private readonly transactionResourceDbProvider!: TransactionResourceDbProvider;

    public async index(request: Hapi.Request): Promise<SomeBlockResourcesPage> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as BlockCriteria;

        return this.blockResourceDbProvider.getBlocksPage(pagination, ordering, transform, criteria);
    }

    public async search(request: Hapi.Request): Promise<SomeBlockResourcesPage> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = request.payload;

        return this.blockResourceDbProvider.getBlocksPage(pagination, ordering, transform, criteria);
    }

    public first(request: Hapi.Request): SomeBlockResource {
        const transform = request.query.transform as boolean;

        return this.blockResourceStateProvider.getGenesisBlock(transform);
    }

    public async last(request: Hapi.Request): Promise<SomeBlockResource> {
        const transform = request.query.transform as boolean;

        return this.blockResourceStateProvider.getLastBlock(transform);
    }

    public async show(request: Hapi.Request): Promise<SomeBlockResource | Boom> {
        const transform = request.query.transform as boolean;
        const blockId = request.params.id as string;
        const block = await this.blockResourceDbProvider.getBlock(transform, blockId);

        if (!block) {
            return notFound("Block not found");
        }

        return block;
    }

    public async transactions(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const transform = request.query.transform as boolean;
        const blockId = request.params.id as string;
        const block = await this.blockResourceDbProvider.getBlock(transform, blockId);

        if (!block) {
            return notFound("Block not found");
        }

        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const criteria = this.getCriteria(request) as BlockCriteria;

        return this.transactionResourceDbProvider.getTransactionsPage(pagination, ordering, transform, criteria, {
            blockId: block.id,
        });
    }
}
