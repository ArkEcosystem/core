"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = __importDefault(require("@hapi/boom"));
const controller_1 = require("../shared/controller");
class WalletsController extends controller_1.Controller {
    async index(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.wallets.index(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async top(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.wallets.top(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async show(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.wallets.show(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async transactions(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.wallets.transactions(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async transactionsSent(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.wallets.transactionsSent(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async transactionsReceived(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.wallets.transactionsReceived(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async votes(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.wallets.votes(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async locks(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.wallets.locks(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
    async search(request, h) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.wallets.search(request);
            return super.respondWithCache(data, h);
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
}
exports.WalletsController = WalletsController;
//# sourceMappingURL=controller.js.map