import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BridgechainResource, BusinessResource } from "../resources";

@Container.injectable()
export class BusinessController extends Controller {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const businesses = this.walletRepository.search(Contracts.State.SearchScope.Businesses, {
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(businesses, BusinessResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const business = this.walletRepository.findByPublicKey(request.params.id);
        if (!business) {
            return Boom.notFound("Business not found");
        }

        return this.respondWithResource(business, BusinessResource);
    }

    public async bridgechains(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const business = this.walletRepository.search(Contracts.State.SearchScope.Businesses, {
                publicKey: request.params.id,
            });

            if (!business) {
                return Boom.notFound("Business not found");
            }

            const bridgechains = this.walletRepository.search(Contracts.State.SearchScope.Bridgechains, {
                publicKey: request.params.id,
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
