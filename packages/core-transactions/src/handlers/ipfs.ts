import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { TransactionReader } from "../transaction-reader";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
export class IpfsTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.IpfsTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["ipfs", "ipfs.hashes"];
    }

    public async bootstrap(
        connection: Contracts.Database.Connection,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet = walletRepository.findByPublicKey(transaction.senderPublicKey);
                if (!wallet.hasAttribute("ipfs")) {
                    wallet.setAttribute("ipfs", { hashes: {} });
                }

                const ipfsHashes: Contracts.State.WalletIpfsAttributes = wallet.getAttribute("ipfs.hashes");
                ipfsHashes[transaction.asset.ipfs] = true;
            }
        }
    }

    public async isActivated(): Promise<boolean> {
        return !!Managers.configManager.getMilestone().aip11;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        databaseWalletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        // TODO implement unique ipfs hash on blockchain (not just on wallet)
        // if (wallet.ipfsHashes[transaction.data.asset.ipfs]) {
        //     throw new IpfsHashAlreadyExists();
        // }

        return super.throwIfCannotBeApplied(transaction, wallet, databaseWalletRepository);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        if (!sender.hasAttribute("ipfs")) {
            sender.setAttribute("ipfs", { hashes: {} });
        }

        const ipfsHashes: Contracts.State.WalletIpfsAttributes = sender.getAttribute("ipfs.hashes");
        ipfsHashes[transaction.data.asset.ipfs] = true;

        walletRepository.reindex(sender);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, walletRepository);

        const sender: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);
        const ipfsHashes: Contracts.State.WalletIpfsAttributes = sender.getAttribute("ipfs.hashes");
        delete ipfsHashes[transaction.data.asset.ipfs];

        walletRepository.reindex(sender);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletRepository: Contracts.State.WalletRepository,
    ): Promise<void> {}
}
