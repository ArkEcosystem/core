import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";

import { WalletRepository } from "./wallet-repository";

@Container.injectable()
export class TempWalletRepository extends WalletRepository {
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly blockchainWalletRepository!: Contracts.State.WalletRepository;

    @Container.postConstruct()
    public initialize() {
        this.index(this.blockchainWalletRepository.allByUsername());

        for (const index of this.blockchainWalletRepository.getIndexNames()) {
            if (this.indexes[index]) {
                continue;
            }

            this.indexes[index] = this.blockchainWalletRepository.getIndex(index).clone();
        }
        return this;
    }

    public reindex(wallet: Contracts.State.Wallet): void {
        super.reindex(wallet.clone());
    }

    public findByAddress(address: string): Contracts.State.Wallet {
        return this.findByIndex(Contracts.State.WalletIndexes.Addresses, address);
    }

    public findByPublicKey(publicKey: string): Contracts.State.Wallet {
        // Sender wallet may not be indexed yet by public key
        if (!this.blockchainWalletRepository.hasByPublicKey(publicKey)) {
            const wallet: Contracts.State.Wallet = this.findByAddress(Identities.Address.fromPublicKey(publicKey));
            wallet.publicKey = publicKey;

            this.reindex(wallet);

            return wallet;
        }

        return this.findByIndex(Contracts.State.WalletIndexes.PublicKeys, publicKey);
    }

    public findByUsername(username: string): Contracts.State.Wallet {
        return this.findByIndex(Contracts.State.WalletIndexes.Usernames, username);
    }

    public findByIndex(indexName: string, key: string): Contracts.State.Wallet {
        const index: Contracts.State.WalletIndex = this.getIndex(indexName);

        if (!index.has(key)) {
            const parentIndex: Contracts.State.WalletIndex = this.blockchainWalletRepository.getIndex(indexName);

            if (parentIndex.has(key)) {
                const wallet: Contracts.State.Wallet | undefined = parentIndex.get(key);

                Utils.assert.defined<Contracts.State.Wallet>(wallet);

                index.set(key, wallet.clone());
            } else if (indexName === Contracts.State.WalletIndexes.Addresses) {
                index.set(key, this.createWallet(key));
            }
        }

        const wallet: Contracts.State.Wallet | undefined = index.get(key);

        Utils.assert.defined<Contracts.State.Wallet>(wallet);

        return wallet;
    }

    public hasByAddress(address: string): boolean {
        return this.blockchainWalletRepository.hasByAddress(address);
    }

    public hasByPublicKey(publicKey: string): boolean {
        return this.blockchainWalletRepository.hasByPublicKey(publicKey);
    }

    public hasByUsername(username: string): boolean {
        return this.blockchainWalletRepository.hasByUsername(username);
    }

    public reset(): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }
}
