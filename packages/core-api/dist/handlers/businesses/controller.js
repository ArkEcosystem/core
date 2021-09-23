"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const controller_1 = require("../shared/controller");
class BusinessController extends controller_1.Controller {
    async index(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.businesses.index(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async show(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.businesses.show(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async bridgechains(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.businesses.bridgechains(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async bridgechain(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.businesses.bridgechain(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async search(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.businesses.search(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
}
exports.BusinessController = BusinessController;
//# sourceMappingURL=controller.js.map