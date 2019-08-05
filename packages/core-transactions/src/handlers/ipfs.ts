import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

export class IpfsTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.IpfsTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);

        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            if (!wallet.hasAttribute("ipfs")) {
                wallet.setAttribute("ipfs", { hashes: {} });
            }

            const ipfsHashes: State.IWalletIpfsAttributes = wallet.getAttribute("ipfs.hashes");
            ipfsHashes[transaction.asset.ipfs] = true;
        }
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): Promise<void> {
        // TODO implement unique ipfs hash on blockchain (not just on wallet)
        // if (wallet.ipfsHashes[transaction.data.asset.ipfs]) {
        //     throw new IpfsHashAlreadyExists();
        // }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        if (!sender.hasAttribute("ipfs")) {
            sender.setAttribute("ipfs", { hashes: {} });
        }

        const ipfsHashes: State.IWalletIpfsAttributes = sender.getAttribute("ipfs.hashes");
        ipfsHashes[transaction.data.asset.ipfs] = true;

        walletManager.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const ipfsHashes: State.IWalletIpfsAttributes = sender.getAttribute("ipfs.hashes");
        delete ipfsHashes[transaction.data.asset.ipfs];

        walletManager.reindex(sender);
    }

    // tslint:disable-next-line:no-empty
    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {}

    // tslint:disable-next-line:no-empty
    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {}
}
