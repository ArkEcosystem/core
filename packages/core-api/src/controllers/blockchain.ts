import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";

import { Controller } from "./controller";

export class BlockchainController extends Controller {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    public async index() {
        const { data } = this.stateStore.getLastBlock();

        const burnWallet = this.walletRepository.getBurnWallet();
        const supply = Utils.supplyCalculator.calculate(data.height);

        return {
            data: {
                block: {
                    height: data.height,
                    id: data.id,
                },
                supply: supply.minus(burnWallet.getBalance()).toFixed(),
                generated: supply.toFixed(),
                burned: burnWallet.getBalance().toFixed(),
            },
        };
    }
}
