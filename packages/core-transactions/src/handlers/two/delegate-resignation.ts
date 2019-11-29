import { Container, Contracts, Enums, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

import { NotEnoughDelegatesError, WalletAlreadyResignedError, WalletNotADelegateError } from "../../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "../transaction";
import { Two } from "../index";
import { TransactionReader } from "../../transaction-reader";
import { Models } from "@arkecosystem/core-database";

// todo: revisit the implementation, container usage and arguments after core-database rework
// todo: replace unnecessary function arguments with dependency injection to avoid passing around references
@Container.injectable()
export class DelegateResignationTransactionHandler extends TransactionHandler {
    public walletAttributes(): ReadonlyArray<string> {
        return ["delegate.resigned"];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.Two.DelegateResignationTransaction;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [Two.DelegateRegistrationTransactionHandler];
    }

    public async bootstrap(): Promise<void> {
        const reader: TransactionReader = this.getTransactionReader();
        const transactions: Models.Transaction[] = await reader.read();
        for (const transaction of transactions) {
            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            wallet.setAttribute("delegate.resigned", true);
            this.walletRepository.reindex(wallet);
        }
    }
    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        if (!wallet.isDelegate()) {
            throw new WalletNotADelegateError();
        }

        if (wallet.hasAttribute("delegate.resigned")) {
            throw new WalletAlreadyResignedError();
        }

        const delegates: ReadonlyArray<Contracts.State.Wallet> = this.walletRepository.allByUsername();
        let requiredDelegates: number = Managers.configManager.getMilestone().activeDelegates + 1;
        for (const delegate of delegates) {
            if (requiredDelegates === 0) {
                break;
            }

            if (delegate.hasAttribute("delegate.resigned")) {
                continue;
            }

            requiredDelegates--;
        }

        if (requiredDelegates > 0) {
            throw new NotEnoughDelegatesError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, customWalletRepository);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(Enums.DelegateEvent.Resigned, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: Contracts.TransactionPool.Connection,
        processor: Contracts.TransactionPool.Processor,
    ): Promise<boolean> {
        // TODO: ioc
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            // @ts-ignore
            const wallet: Contracts.State.Wallet = pool.poolWalletRepository.findByPublicKey(data.senderPublicKey);
            processor.pushError(
                data,
                "ERR_PENDING",
                `Delegate resignation for "${wallet.getAttribute("delegate.username")}" already in the pool`,
            );
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.applyToSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        const senderWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        senderWallet.setAttribute("delegate.resigned", true);
        walletRepository.reindex(senderWallet);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
    ): Promise<void> {
        await super.revertForSender(transaction, customWalletRepository);

        const walletRepository: Contracts.State.WalletRepository = customWalletRepository ?? this.walletRepository;

        Utils.assert.defined<string>(transaction.data.senderPublicKey);

        walletRepository.findByPublicKey(transaction.data.senderPublicKey).forgetAttribute("delegate.resigned");
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line: no-empty
    ): Promise<void> { }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        customWalletRepository?: Contracts.State.WalletRepository,
        // tslint:disable-next-line: no-empty
    ): Promise<void> { }
}
