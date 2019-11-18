import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BusinessResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class BusinessController extends Controller {
    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly databaseService!: Contracts.Database.DatabaseService;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const businesses = this.databaseService.wallets.search(Contracts.Database.SearchScope.Businesses, {
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(businesses, BusinessResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const business = this.databaseService.wallets.search(Contracts.Database.SearchScope.Businesses, {
            businessId: request.params.id,
        }).rows[0];

        if (!business) {
            return Boom.notFound("Business not found");
        }

        return this.respondWithResource(business, BusinessResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const businesses = this.databaseService.wallets.search(Contracts.Database.SearchScope.Businesses, {
            ...request.payload,
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(businesses, BusinessResource);
    }
}
