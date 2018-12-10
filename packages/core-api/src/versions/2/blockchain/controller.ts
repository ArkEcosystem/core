import { app } from "@arkecosystem/core-container";
import { bignumify, supplyCalculator } from "@arkecosystem/core-utils";
import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class BlockchainController extends Controller {
    protected config: any;
    protected blockchain: any;

    public constructor() {
        super();

        this.config = app.resolvePlugin("config");
        this.blockchain = app.resolvePlugin("blockchain");
    }

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
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
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
