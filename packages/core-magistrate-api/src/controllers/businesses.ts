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
        const wallet = this.walletRepository.findByScope(Contracts.State.SearchScope.Wallets, request.params.id);
        if (!wallet || !wallet.hasAttribute("business")) {
            return Boom.notFound("Business not found");
        }

        if (!wallet.publicKey) {
            return Boom.internal("Wallet missing public key property");
        }

        const business = this.walletRepository.search(Contracts.State.SearchScope.Businesses, {
            publicKey: wallet.publicKey,
        }).rows[0];
        if (!business) {
            return Boom.notFound("Business not found");
        }

        return this.respondWithResource(business, BusinessResource);
    }

    public async bridgechains(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const wallet = this.walletRepository.findByScope(Contracts.State.SearchScope.Wallets, request.params.id);

            if (!wallet || !wallet.hasAttribute("business")) {
                return Boom.notFound("Business not found");
            }

            const bridgechains = this.walletRepository.search(Contracts.State.SearchScope.Bridgechains, {
                publicKey: wallet.publicKey,
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
