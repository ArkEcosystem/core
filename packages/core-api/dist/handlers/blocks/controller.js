"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const boom_1 = __importDefault(require("@hapi/boom"));
const controller_1 = require("../shared/controller");
class BlocksController extends controller_1.Controller {
    async index(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.blocks.index(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async first(request, h) {
        try {
            return super.respondWithResource(core_container_1.app
                .resolvePlugin("state")
                .getStore()
                .getGenesisBlock().data, "block", request.query.transform);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async last(request, h) {
        try {
            return super.respondWithResource(core_container_1.app.resolvePlugin("blockchain").getLastBlock().data, "block", request.query.transform);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async show(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.blocks.show(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async transactions(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.blocks.transactions(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async search(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.blocks.search(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
}
exports.BlocksController = BlocksController;
//# sourceMappingURL=controller.js.map