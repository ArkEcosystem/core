import { Controller } from "@arkecosystem/core-api";
import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { EntityResource } from "../resources";

@Container.injectable()
export class EntityController extends Controller {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    protected readonly walletRepository!: Contracts.State.WalletRepository;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const entities = this.walletRepository.search(Contracts.State.SearchScope.Entities, {
            ...request.query,
            ...this.getListingPage(request),
        });

        return this.toPagination(entities, EntityResource);
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const entity = this.walletRepository.search(Contracts.State.SearchScope.Entities, {
            id: request.params.id,
        }).rows[0];

        if (!entity) {
            return Boom.notFound("Entity not found");
        }

        return this.respondWithResource(entity, EntityResource);
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const entities = this.walletRepository.search(Contracts.State.SearchScope.Entities, {
            ...request.payload,
            ...request.query,
            ...this.getListingPage(request),
        });

        return this.toPagination(entities, EntityResource);
    }
}
