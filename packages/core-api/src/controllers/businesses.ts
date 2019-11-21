import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BusinessResource, BridgechainResource } from "../resources";
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

    public async bridgechains(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const business = this.walletRepository.search(Contracts.State.SearchScope.Businesses, {
                businessId: request.params.id,
            });

            if (!business) {
                return Boom.notFound("Business not found");
            }

            const bridgechains = this.walletRepository.search(Contracts.State.SearchScope.Bridgechains, {
                businessId: request.params.id,
                ...request.query,
                ...this.paginate(request),
            });

            return this.toPagination(bridgechains, BridgechainResource);
        } catch (error) {
            return Boom.badImplementation(error);
        }
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
