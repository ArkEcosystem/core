"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const controller_1 = require("../shared/controller");
class DelegatesController extends controller_1.Controller {
    async index(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.delegates.index(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async show(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.delegates.show(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async search(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.delegates.search(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async blocks(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.delegates.blocks(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async voters(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.delegates.voters(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
}
exports.DelegatesController = DelegatesController;
//# sourceMappingURL=controller.js.map