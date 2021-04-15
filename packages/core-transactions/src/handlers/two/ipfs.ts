import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { IpfsHashAlreadyExists } from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
export class IpfsTransactionHandler extends TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionPoolQuery)
    private readonly poolQuery!: Contracts.TransactionPool.Query;

    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

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
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<string>(transaction.asset?.ipfs);

            const wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            if (!wallet.hasAttribute("ipfs")) {
                wallet.setAttribute("ipfs", { hashes: {} });
            }

            const ipfsHashes: Contracts.State.WalletIpfsAttributes = wallet.getAttribute("ipfs.hashes");
            ipfsHashes[transaction.asset.ipfs] = true;
            this.walletRepository.index(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        AppUtils.assert.defined<string>(transaction.data.asset?.ipfs);

        const hasIPFS: boolean = this.poolQuery
            .getAll()
            .whereKind(transaction)
            .wherePredicate((t) => t.data.asset!.ipfs === transaction.data.asset!.ipfs)
            .has();

        if (hasIPFS) {
            throw new Contracts.TransactionPool.PoolError(
                `IPFS transaction with IPFS address "${transaction.data.asset.ipfs}" already in the pool`,
                "ERR_PENDING",
            );
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        if (Utils.isException(transaction.data)) {
            return;
        }

        AppUtils.assert.defined<Interfaces.IHtlcLockAsset>(transaction.data.asset?.ipfs);

        if (this.walletRepository.hasByIndex(Contracts.State.WalletIndexes.Ipfs, transaction.data.asset.ipfs)) {
            throw new IpfsHashAlreadyExists();
        }

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        if (!sender.hasAttribute("ipfs")) {
            sender.setAttribute("ipfs", { hashes: {} });
        }

        AppUtils.assert.defined<string>(transaction.data.asset?.ipfs);

        sender.getAttribute("ipfs.hashes", {})[transaction.data.asset.ipfs] = true;

        this.walletRepository.index(sender);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        AppUtils.assert.defined<Interfaces.ITransactionAsset>(transaction.data.asset?.ipfs);

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
