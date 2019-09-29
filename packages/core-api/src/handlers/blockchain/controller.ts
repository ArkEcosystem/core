import { Utils } from "@arkecosystem/core-kernel";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";

import { Controller } from "../shared/controller";

// todo: remove the abstract and use dependency injection if needed
export class BlockchainController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();

            return {
                data: {
                    block: {
                        height: lastBlock.data.height,
                        id: lastBlock.data.id,
                    },
                    supply: Utils.supplyCalculator.calculate(lastBlock.data.height),
                },
            };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
