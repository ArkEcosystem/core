"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_utils_1 = require("@arkecosystem/core-utils");
const boom_1 = __importDefault(require("@hapi/boom"));
const controller_1 = require("../shared/controller");
class BlockchainController extends controller_1.Controller {
    async index(request, h) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            return {
                data: {
                    block: {
                        height: lastBlock.data.height,
                        id: lastBlock.data.id,
                    },
                    supply: core_utils_1.supplyCalculator.calculate(lastBlock.data.height),
                },
            };
        }
        catch (error) {
            return boom_1.default.badImplementation(error);
        }
    }
}
exports.BlockchainController = BlockchainController;
//# sourceMappingURL=controller.js.map