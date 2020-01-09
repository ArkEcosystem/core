import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { BridgechainResource } from "../resources";

@Container.injectable()
export class BridgechainController extends Controller {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const bridgechains = this.walletRepository.search(Contracts.State.SearchScope.Bridgechains, {
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(bridgechains, BridgechainResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const bridgechain = this.walletRepository.search(Contracts.State.SearchScope.Bridgechains, {
            genesisHash: request.params.id,
        }).rows[0];

        if (!bridgechain) {
            return Boom.notFound("Bridgechain not found");
        }

        return this.respondWithResource(bridgechain, BridgechainResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const bridgechains = this.walletRepository.search(Contracts.State.SearchScope.Bridgechains, {
            ...request.payload,
            ...request.query,
            ...this.paginate(request),
        });

        return this.toPagination(bridgechains, BridgechainResource);
    }
}
