"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const utils_1 = require("../utils");
class Controller {
    constructor() {
        this.config = core_container_1.app.getConfig();
        this.blockchain = core_container_1.app.resolvePlugin("blockchain");
        this.databaseService = core_container_1.app.resolvePlugin("database");
    }
    paginate(request) {
        // @ts-ignore
        return utils_1.paginate(request);
    }
    respondWithResource(data, transformer, transform = true) {
        return utils_1.respondWithResource(data, transformer, transform);
    }
    respondWithCollection(data, transformer, transform = true) {
        return utils_1.respondWithCollection(data, transformer, transform);
    }
    respondWithCache(data, h) {
        return utils_1.respondWithCache(data, h);
    }
    toResource(data, transformer, transform = true) {
        return utils_1.toResource(data, transformer, transform);
    }
    toCollection(data, transformer, transform = true) {
        return utils_1.toCollection(data, transformer, transform);
    }
    toPagination(data, transformer, transform = true) {
        return utils_1.toPagination(data, transformer, transform);
    }
}
exports.Controller = Controller;
//# sourceMappingURL=controller.js.map