import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";

import { Controller } from "./controller";

export class BlockchainController extends Controller {
    @Container.inject(Container.Identifiers.CryptoManager)
    private readonly cryptoManager!: CryptoSuite.CryptoManager;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public async index() {
        const { data } = this.stateStore.getLastBlock();

        return {
            data: {
                block: {
                    height: data.height,
                    id: data.id,
                },
                supply: Utils.supplyCalculator.calculate(data.height, this.cryptoManager),
            },
        };
    }
}
