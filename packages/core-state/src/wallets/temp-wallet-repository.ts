import { Contracts, Utils } from "@arkecosystem/core-kernel";
import { Identities } from "@arkecosystem/crypto";

import { Wallet } from "./wallet";
import { WalletRepository } from "./wallet-repository";

export class TempWalletRepository extends WalletRepository {
    public constructor(private readonly walletRepository: Contracts.State.WalletRepository) {
        super();

        this.index(this.walletRepository.allByUsername());

        for (const index of walletRepository.getIndexNames()) {
            if (this.indexes[index]) {
                continue;
            }

            this.indexes[index] = walletRepository.getIndex(index).clone();
        }
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
                index.set(key, Utils.assert.defined<Contracts.State.Wallet>(parentIndex.get(key)).clone());
            } else if (indexName === Contracts.State.WalletIndexes.Addresses) {
                index.set(key, new Wallet(key));
            }
        }

        return Utils.assert.defined(index.get(key));
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
