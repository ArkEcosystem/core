import { Models } from "@arkecosystem/core-database";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Utils as CryptoUtils } from "@arkecosystem/crypto";

import { IpfsHashAlreadyExists } from "../../errors";
import { TransactionReader } from "../../transaction-reader";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
export class IpfsTransactionHandler extends TransactionHandler {
    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["ipfs", "ipfs.hashes"];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.IpfsTransaction;
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            if (!wallet.hasAttribute("ipfs")) {
                wallet.setAttribute("ipfs", { hashes: {} });
            }

            const ipfsHashes: Contracts.State.WalletIpfsAttributes = wallet.getAttribute("ipfs.hashes");
            ipfsHashes[transaction.asset.ipfs!] = true;
            this.walletRepository.index(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        if (CryptoUtils.isException(transaction.data.id)) {
            return;
        }

        if (this.walletRepository.getIndex(Contracts.State.WalletIndexes.Ipfs).has(transaction.data.asset!.ipfs!)) {
            throw new IpfsHashAlreadyExists();
        }

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        if (!sender.hasAttribute("ipfs")) {
            sender.setAttribute("ipfs", { hashes: {} });
        }

        Utils.assert.defined<string>(transaction.data.asset?.ipfs);

        sender.getAttribute("ipfs.hashes", {})[transaction.data.asset.ipfs] = true;

        this.walletRepository.index(sender);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        Utils.assert.defined<Interfaces.ITransactionAsset>(transaction.data.asset?.ipfs);

        const ipfsHashes = sender.getAttribute("ipfs.hashes");
        delete ipfsHashes[transaction.data.asset.ipfs];

        if (!Object.keys(ipfsHashes).length) {
            sender.forgetAttribute("ipfs");
        }

        this.walletRepository.index(sender);
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}
