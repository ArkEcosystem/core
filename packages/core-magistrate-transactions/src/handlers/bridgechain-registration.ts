import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import {
    Interfaces as MagistrateInterfaces,
    Transactions as MagistrateTransactions,
} from "@arkecosystem/core-magistrate-crypto";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";

import {
    BridgechainAlreadyRegisteredError,
    BusinessIsResignedError,
    GenesisHashAlreadyRegisteredError,
    PortKeyMustBeValidPackageNameError,
    WalletIsNotBusinessError,
} from "../errors";
import { MagistrateApplicationEvents } from "../events";
import { IBridgechainWalletAttributes, IBusinessWalletAttributes } from "../interfaces";
import { BusinessRegistrationTransactionHandler } from "./business-registration";
import { MagistrateTransactionHandler } from "./magistrate-handler";
import { packageNameRegex } from "./utils";

@Container.injectable()
export class BridgechainRegistrationTransactionHandler extends MagistrateTransactionHandler {
    @Container.inject(Container.Identifiers.TransactionHistoryService)
    private readonly transactionHistoryService!: Contracts.Shared.TransactionHistoryService;

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [BusinessRegistrationTransactionHandler];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return MagistrateTransactions.BridgechainRegistrationTransaction;
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["business.bridgechains.bridgechain"];
    }

    public async bootstrap(): Promise<void> {
        const criteria = {
            typeGroup: this.getConstructor().typeGroup,
            type: this.getConstructor().type,
        };

        for await (const transaction of this.transactionHistoryService.streamByCriteria(criteria)) {
            AppUtils.assert.defined<string>(transaction.senderPublicKey);
            AppUtils.assert.defined<MagistrateInterfaces.IBridgechainRegistrationAsset>(
                transaction.asset?.bridgechainRegistration,
            );

            const wallet: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.senderPublicKey);
            const businessAttributes: IBusinessWalletAttributes = wallet.getAttribute<IBusinessWalletAttributes>(
                "business",
            );
            if (!businessAttributes.bridgechains) {
                businessAttributes.bridgechains = {};
            }

            const bridgechainId: string = transaction.asset.bridgechainRegistration.genesisHash;
            businessAttributes.bridgechains[bridgechainId] = {
                bridgechainAsset: transaction.asset.bridgechainRegistration,
            };

            wallet.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
            this.walletRepository.index(wallet);
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: Contracts.State.Wallet,
    ): Promise<void> {
        if (Utils.isException(transaction.data)) {
            return;
        }

        if (!wallet.hasAttribute("business")) {
            throw new WalletIsNotBusinessError();
        }

        if (wallet.hasAttribute("business.resigned")) {
            throw new BusinessIsResignedError();
        }

        const { data }: Interfaces.ITransaction = transaction;
        if (wallet.hasAttribute("business.bridgechains")) {
            const bridgechains: Record<string, IBridgechainWalletAttributes> = wallet.getAttribute(
                "business.bridgechains",
            );

            if (
                Object.values(bridgechains).some(
                    (bridgechain) =>
                        data.asset &&
                        bridgechain.bridgechainAsset.name.toLowerCase() ===
                            data.asset.bridgechainRegistration.name.toLowerCase(),
                )
            ) {
                throw new BridgechainAlreadyRegisteredError();
            }

            if (data.asset && bridgechains[data.asset.bridgechainRegistration.genesisHash]) {
                throw new GenesisHashAlreadyRegisteredError();
            }
        }

        if (data.asset) {
            for (const portKey of Object.keys(data.asset.bridgechainRegistration.ports)) {
                if (!packageNameRegex.test(portKey)) {
                    throw new PortKeyMustBeValidPackageNameError();
                }
            }
        }

        return super.throwIfCannotBeApplied(transaction, wallet);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: Contracts.Kernel.EventDispatcher): void {
        emitter.dispatch(MagistrateApplicationEvents.BridgechainRegistered, transaction.data);
    }

    public async applyToSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.applyToSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        if (!businessAttributes.bridgechains) {
            businessAttributes.bridgechains = {};
        }

        AppUtils.assert.defined<MagistrateInterfaces.IBridgechainRegistrationAsset>(
            transaction.data.asset?.bridgechainRegistration,
        );

        const bridgechainId: string = transaction.data.asset.bridgechainRegistration.genesisHash;
        businessAttributes.bridgechains[bridgechainId] = {
            bridgechainAsset: transaction.data.asset.bridgechainRegistration,
        };

        sender.setAttribute<IBusinessWalletAttributes>("business", businessAttributes);
        this.walletRepository.index(sender);
    }

    public async revertForSender(transaction: Interfaces.ITransaction): Promise<void> {
        await super.revertForSender(transaction);

        AppUtils.assert.defined<string>(transaction.data.senderPublicKey);

        const sender: Contracts.State.Wallet = this.walletRepository.findByPublicKey(transaction.data.senderPublicKey);

        const businessAttributes: IBusinessWalletAttributes = sender.getAttribute<IBusinessWalletAttributes>(
            "business",
        );

        AppUtils.assert.defined<Record<string, IBridgechainWalletAttributes>>(businessAttributes.bridgechains);

        const bridgechainId: string | undefined = Object.keys(businessAttributes.bridgechains).pop();

        AppUtils.assert.defined<string>(bridgechainId);

        delete businessAttributes.bridgechains[bridgechainId];

        this.walletRepository.index(sender);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
