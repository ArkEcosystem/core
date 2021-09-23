"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const boom_1 = __importDefault(require("@hapi/boom"));
const services_1 = require("../../services");
const utils_1 = require("../utils");
const delegates = async (request) => {
    const databaseService = core_container_1.app.resolvePlugin("database");
    const roundsRepository = databaseService.connection.roundsRepository;
    const delegates = await roundsRepository.findById(request.params.id);
    if (!delegates || !delegates.length) {
        return boom_1.default.notFound("Round not found");
    }
    return utils_1.respondWithCollection(delegates, "round-delegate");
};
exports.registerMethods = server => {
    const { activeDelegates, blocktime } = core_container_1.app.getConfig().getMilestone();
    services_1.ServerCache.make(server).method("v2.rounds.delegates", delegates, activeDelegates * blocktime, request => ({
        id: request.params.id,
    }));
};
//# sourceMappingURL=methods.js.map