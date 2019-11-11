import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";

import { Wallet } from "./wallet";
import { WalletRepository } from "./wallet-repository";

export class TempWalletRepository extends WalletRepository {
    private walletRepository!: Contracts.State.WalletRepository;

    public setup(walletRepository: Contracts.State.WalletRepository) {
        this.walletRepository = walletRepository;

        return this;
    }

    public init() {
        this.index(this.walletRepository.allByUsername());

        for (const index of this.walletRepository.getIndexNames()) {
            if (this.indexes[index]) {
                continue;
            }

            this.indexes[index] = this.walletRepository.getIndex(index).clone();
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
        if (!this.walletRepository.hasByPublicKey(publicKey)) {
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
            const parentIndex: Contracts.State.WalletIndex = this.walletRepository.getIndex(indexName);

            if (parentIndex.has(key)) {
                const wallet: Contracts.State.Wallet | undefined = parentIndex.get(key);

                Utils.assert.defined<Contracts.State.Wallet>(wallet);

                index.set(key, wallet.clone());
            } else if (indexName === Contracts.State.WalletIndexes.Addresses) {
                index.set(key, new Wallet(key, this.app));
            }
        }

        const wallet: Contracts.State.Wallet | undefined = index.get(key);

        Utils.assert.defined<Contracts.State.Wallet>(wallet);

        return wallet;
    }

    public hasByAddress(address: string): boolean {
        return this.walletRepository.hasByAddress(address);
    }

    public hasByPublicKey(publicKey: string): boolean {
        return this.walletRepository.hasByPublicKey(publicKey);
    }

    public hasByUsername(username: string): boolean {
        return this.walletRepository.hasByUsername(username);
    }

    public reset(): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }
}
