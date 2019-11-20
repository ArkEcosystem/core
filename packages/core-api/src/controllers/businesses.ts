import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BusinessResource } from "../resources";
import { Controller } from "./controller";

@Container.injectable()
export class BusinessController extends Controller {
    @Container.inject(Container.Identifiers.WalletRepository)
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const businesses = this.walletRepository.search(Contracts.State.SearchScope.Businesses, {
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(businesses, BusinessResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const business = this.walletRepository.search(Contracts.State.SearchScope.Businesses, {
            businessId: request.params.id,
        }).rows[0];

        if (!business) {
            return Boom.notFound("Business not found");
        }

        return this.respondWithResource(business, BusinessResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const businesses = this.walletRepository.search(Contracts.State.SearchScope.Businesses, {
            ...request.payload,
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(businesses, BusinessResource);
    }
}
