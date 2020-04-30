import { Repositories } from "@arkecosystem/core-database";
import { Container } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { RoundResource } from "../resources";
import { Controller } from "./controller";

export class RoundsController extends Controller {
    @Container.inject(Container.Identifiers.DatabaseRoundRepository)
    private readonly roundRepository!: Repositories.RoundRepository;

    public async delegates(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const delegates = await this.roundRepository.findById(request.params.id);

        if (!delegates || !delegates.length) {
            return Boom.notFound("Round not found");
        }

        return this.respondWithCollection(delegates, RoundResource);
    }
}
