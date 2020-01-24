import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Identities } from "@arkecosystem/crypto";

@Container.injectable()
export class PoolWalletRepository extends Wallets.WalletRepository {
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

    public forget(publicKey: string): void {
        this.forgetByPublicKey(publicKey);
        this.forgetByAddress(Identities.Address.fromPublicKey(publicKey));
    }
}
