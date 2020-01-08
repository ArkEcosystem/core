import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Interfaces } from "@arkecosystem/crypto";

/**
 * @export
 * @class PoolWalletRepository
 * @extends {Wallets.WalletRepository}
 */
@Container.injectable()
export class PoolWalletRepository extends Wallets.WalletRepository {
    /**
     * @private
     * @type {Contracts.State.WalletRepository}
     * @memberof PoolWalletRepository
     */
    @Container.inject(Container.Identifiers.WalletRepository)
    private readonly walletRepository!: Contracts.State.WalletRepository;

    /**
     * @memberof PoolWalletRepository
     */
    public constructor() {
        super();
    }

    /**
     * @memberof PoolWalletRepository
     */
    public initialize(): void {
        const indexes: string[] = this.walletRepository.getIndexNames();
        for (const index of indexes) {
            if (this.indexes[index]) {
                continue;
            }

            this.registerIndex(index, this.walletRepository.getIndex(index).indexer);
        }
    }

    /**
     * @param {string} address
     * @returns {Contracts.State.Wallet}
     * @memberof PoolWalletRepository
     */
    public findByAddress(address: string): Contracts.State.Wallet {
        if (address && !this.hasByAddress(address)) {
            this.reindex(
                this.app
                    .get<any>(Container.Identifiers.DatabaseService)
                    .walletRepository.findByAddress(address)
                    .clone(),
            );
        }

        return this.findByIndex(Contracts.State.WalletIndexes.Addresses, address)!;
    }

    /**
     * @param {(string | string[])} index
     * @param {string} key
     * @returns {Contracts.State.Wallet}
     * @memberof PoolWalletRepository
     */
    public findByIndex(index: string | string[], key: string): Contracts.State.Wallet {
        const wallet = super.findByIndex(index, key);

        if (wallet) {
            return wallet;
        }

        const dbWallet = this.walletRepository.findByIndex(index, key);
        if (dbWallet) {
            const cloneWallet = dbWallet.clone();
            this.reindex(cloneWallet);
            return cloneWallet;
        }

        // FIXME
        // @ts-ignore
        return undefined;
    }

    /**
     * @param {string} publicKey
     * @memberof PoolWalletRepository
     */
    public forget(publicKey: string): void {
        this.forgetByPublicKey(publicKey);
        this.forgetByAddress(Identities.Address.fromPublicKey(publicKey));
    }

    /**
     * @param {Interfaces.ITransaction} transaction
     * @returns {Promise<void>}
     * @memberof PoolWalletRepository
     */
    public async throwIfCannotBeApplied(transaction: Interfaces.ITransaction): Promise<void> {
        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.findByPublicKey(transaction.data.senderPublicKey);

        const handler: Handlers.TransactionHandler = await this.app
            .get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry)
            .getActivatedHandlerForData(transaction.data);

        return handler.throwIfCannotBeApplied(transaction, sender);
    }

    /**
     * @param {Interfaces.ITransaction} transaction
     * @returns {Promise<void>}
     * @memberof PoolWalletRepository
     */
    public async revertTransactionForSender(transaction: Interfaces.ITransaction): Promise<void> {
        const handler: Handlers.TransactionHandler = await this.app
            .get<Handlers.Registry>(Container.Identifiers.TransactionHandlerRegistry)
            .getActivatedHandlerForData(transaction.data);

        return handler.revertForSender(transaction, this);
    }

    /**
     * @memberof PoolWalletRepository
     */
    public reset(): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }
}
