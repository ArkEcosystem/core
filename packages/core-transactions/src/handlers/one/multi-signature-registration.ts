import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";

import { LegacyMultiSignatureError, MultiSignatureAlreadyRegisteredError } from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
export class MultiSignatureRegistrationTransactionHandler extends TransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["multiSignature", "multiSignature.legacy"];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.One.MultiSignatureRegistrationTransaction;
    }

    public async bootstrap(): Promise<void> {
        const criteria = {
            version: this.getConstructor().version,
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<Interfaces.IMultiSignatureLegacyAsset>(transaction.asset?.multiSignatureLegacy);

            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const multiSignatureLegacy: Interfaces.IMultiSignatureLegacyAsset = transaction.asset.multiSignatureLegacy;

            if (wallet.hasMultiSignature()) {
                throw new MultiSignatureAlreadyRegisteredError();
            }

            wallet.setAttribute("multiSignature", multiSignatureLegacy);
            wallet.setAttribute("multiSignature.legacy", true);
            this.walletRepository.index(wallet);
        }
    }

    public async isActivated(): Promise<boolean> {
        return !Managers.configManager.getMilestone().aip11;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        const { data }: Interfaces.ITransaction = transaction;

        if (Utils.isException(data)) {
            return;
        }

        throw new LegacyMultiSignatureError();
    }

    public async throwIfCannotEnterPool(transaction: Interfaces.ITransaction): Promise<void> {
        throw new Contracts.TransactionPool.PoolError(`Deprecated multi-signature registration`, "ERR_DEPRECATED");
    }

    public async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    public async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}
