import { supplyCalculator } from "@arkecosystem/core-utils";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";

export class BlockchainController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const lastBlock = this.blockchain.getLastBlock();

        return {
            data: {
                block: {
                    height: lastBlock.data.height,
                    id: lastBlock.data.id,
                },
                supply: supplyCalculator.calculate(lastBlock.data.height),
            },
        };
    }
}
