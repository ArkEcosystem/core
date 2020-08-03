import { Container } from "@arkecosystem/core-kernel";
import { Boom, notFound } from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Identifiers } from "../identifiers";
import {
    BlockCriteria,
    BlockNotFoundError,
    DbBlockResourceService,
    SomeBlockResource,
    SomeBlockResourcesPage,
    SomeTransactionResourcesPage,
} from "../services";
import { Controller } from "./controller";

@Container.injectable()
export class BlocksController extends Controller {
    @Container.inject(Identifiers.DbBlockResourceService)
    private readonly blockService!: DbBlockResourceService;

    public async index(request: Hapi.Request): Promise<SomeBlockResourcesPage> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = this.getCriteria(request) as BlockCriteria;

        return this.blockService.getBlocksPage(pagination, ordering, transform, criteria);
    }

    public async search(request: Hapi.Request): Promise<SomeBlockResourcesPage> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const criteria = request.payload;

        return this.blockService.getBlocksPage(pagination, ordering, transform, criteria);
    }

    public first(request: Hapi.Request): SomeBlockResource {
        const transform = request.query.transform as boolean;

        return this.blockService.getGenesisBlock(transform);
    }

    public async last(request: Hapi.Request): Promise<SomeBlockResource> {
        const transform = request.query.transform as boolean;

        return this.blockService.getLastBlock(transform);
    }

    public async show(request: Hapi.Request): Promise<SomeBlockResource | Boom> {
        const transform = request.query.transform as boolean;
        const blockId = request.params.id as string;

        try {
            return await this.blockService.getBlock(transform, blockId);
        } catch (error) {
            if (error instanceof BlockNotFoundError) {
                return notFound(error.message);
            } else {
                throw error;
            }
        }
    }

    public async transactions(request: Hapi.Request): Promise<SomeTransactionResourcesPage | Boom> {
        const pagination = this.getPagination(request);
        const ordering = this.getOrdering(request);
        const transform = request.query.transform as boolean;
        const blockId = request.params.id as string;
        const criteria = this.getCriteria(request) as BlockCriteria;

        try {
            return await this.blockService.getBlockTransactionsPage(pagination, ordering, transform, blockId, criteria);
        } catch (error) {
            if (error instanceof BlockNotFoundError) {
                return notFound(error.message);
            } else {
                throw error;
            }
        }
    }
}
