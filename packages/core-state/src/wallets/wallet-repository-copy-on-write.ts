import { Container, Contracts } from "@arkecosystem/core-kernel";

import { WalletRepository } from "./wallet-repository";

// ! This isn't copy-on-write, but copy-on-read and with many asterisks.
// ! It only covers current pool use-cases.
// ! It should be replaced with proper implementation eventually.

@Container.injectable()
export class WalletRepositoryCopyOnWrite extends WalletRepository {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly blockchainWalletRepository!: Contracts.State.WalletRepository;

    public findByAddress(address: string): Contracts.State.Wallet {
        if (address && !this.hasByAddress(address)) {
            this.cloneWallet(this.blockchainWalletRepository, this.blockchainWalletRepository.findByAddress(address));
        }
        return this.findByIndex(Contracts.State.WalletIndexes.Addresses, address)!;
    }

    public hasByIndex(index: string, key: string): boolean {
        if (super.hasByIndex(index, key)) {
            return true;
        }
        if (this.blockchainWalletRepository.hasByIndex(index, key) === false) {
            return false;
        }

        this.cloneWallet(this.blockchainWalletRepository, this.blockchainWalletRepository.findByIndex(index, key));
        return true;
    }

    public allByUsername(): ReadonlyArray<Contracts.State.Wallet> {
        for (const wallet of this.blockchainWalletRepository.allByUsername()) {
            if (!super.hasByAddress(wallet.getAddress())) {
                this.cloneWallet(this.blockchainWalletRepository, wallet);
            }
        }
        return super.allByUsername();
    }
}
