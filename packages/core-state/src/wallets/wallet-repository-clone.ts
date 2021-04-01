import { Container, Contracts } from "@arkecosystem/core-kernel";

import { WalletRepository } from "./wallet-repository";

@Container.injectable()
export class WalletRepositoryClone extends WalletRepository {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly blockchainWalletRepository!: Contracts.State.WalletRepository;

    @Container.postConstruct()
    public initialize(): void {
        super.initialize();
    }


}
