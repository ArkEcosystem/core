import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";

import { ServerCache } from "../../services";

export const registerMethods = (app: Contracts.Kernel.Application, server) => {
    // todo: rework to make use of injection rather then manual resolving
    const delegates = async request => {
        const delegates = await app
            .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
            .connection.roundsRepository.findById(request.params.id);

        if (!delegates || !delegates.length) {
            return Boom.notFound("Round not found");
        }

        return server.app.utils.respondWithCollection(delegates, "round-delegate");
    };

    const { activeDelegates, blocktime } = Managers.configManager.getMilestone();

    app.resolve<ServerCache>(ServerCache)
        .make(server)
        .method("v2.rounds.delegates", delegates, activeDelegates * blocktime, request => ({
            id: request.params.id,
        }));
};
