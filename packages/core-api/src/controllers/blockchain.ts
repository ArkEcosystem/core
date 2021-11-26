import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";

import { Controller } from "./controller";

export class BlockchainController extends Controller {
    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const { data } = this.stateStore.getLastBlock();

        return {
            data: {
                block: {
                    height: data.height,
                    id: data.id,
                },
                supply: Utils.supplyCalculator.calculate(data.height),
            },
        };
    }
}
