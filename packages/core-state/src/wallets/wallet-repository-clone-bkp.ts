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

        for (const wallet of this.blockchainWalletRepository.allByAddress()) {
            this.cloneWallet(this.blockchainWalletRepository, wallet);
        }
    }

    public index(wallets: Contracts.State.Wallet | Contracts.State.Wallet[]): void {
        for (const wallet of Array.isArray(wallets) ? wallets : [wallets]) {
            if (this.blockchainWalletRepository.hasByAddress(wallet.address)) {
                if (this.blockchainWalletRepository.findByAddress(wallet.address) === wallet) {
                    throw new Error("Can't index state=blockchain wallet");
                }
            }
        }

        super.index(wallets);
    }
}
