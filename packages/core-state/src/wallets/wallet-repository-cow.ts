import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";

import { WalletRepository } from "./wallet-repository";

@Container.injectable()
export class WalletRepositoryCow extends WalletRepository {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly blockchainWalletRepository!: Contracts.State.WalletRepository;

    public findByAddress(address: string): Contracts.State.Wallet {
        if (address && !this.hasByAddress(address)) {
            const walletClone = this.blockchainWalletRepository.findByAddress(address).clone();
            this.reindex(walletClone);
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
        const walletClone = this.blockchainWalletRepository.findByIndex(index, key).clone();
        this.reindex(walletClone);
        return true;
    }

    public allByUsername(): ReadonlyArray<Contracts.State.Wallet> {
        for (const wallet of this.blockchainWalletRepository.allByUsername()) {
            if (super.hasByAddress(wallet.address) === false) {
                this.reindex(wallet.clone());
            }
        }
        return super.allByUsername();
    }

    public forget(publicKey: string): void {
        this.forgetByPublicKey(publicKey);
        this.forgetByAddress(Identities.Address.fromPublicKey(publicKey));
    }
}
