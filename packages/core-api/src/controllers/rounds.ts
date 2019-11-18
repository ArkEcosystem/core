import { Container, Contracts } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { RoundResource } from "../resources";
import { Controller } from "./controller";

export class RoundsController extends Controller {
    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly databaseService!: Contracts.Database.DatabaseService;

    public async delegates(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegates = await this.databaseService.connection.roundsRepository.findById(request.params.id);

        if (!delegates || !delegates.length) {
            return Boom.notFound("Round not found");
        }

        return this.respondWithCollection(delegates, RoundResource);
    }
}
