import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { ServerCache } from "../../../services";
import { respondWithCollection } from "../utils";

const config = app.getConfig();
const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const roundsRepository = databaseService.connection.roundsRepository;

const delegates = async request => {
    const delegates = await roundsRepository.findById(request.params.id);

    if (!delegates || !delegates.length) {
        return Boom.notFound("Round not found");
    }

    return respondWithCollection(request, delegates, "round-delegate");
};

export const registerMethods = server => {
    const { activeDelegates, blocktime } = config.getMilestone();

    ServerCache.make(server).method("v2.rounds.delegates", delegates, activeDelegates * blocktime, request => ({
        id: request.params.id,
    }));
};
