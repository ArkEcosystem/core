import { Container, Services, Utils } from "@arkecosystem/core-kernel";
import { Enums, Transactions } from "@arkecosystem/crypto";

import { AlreadyRegisteredError, UnsatisfiedDependencyError } from "../errors";
import { TransactionHandler, TransactionHandlerConstructor } from "./transaction";

@Container.injectable()
export class TransactionHandlerProvider {
    @Container.inject(Container.Identifiers.WalletAttributes)
    private readonly attributeSet!: Services.Attributes.AttributeSet;

    @Container.multiInject(Container.Identifiers.TransactionHandler)
    @Container.tagged("state", "null")
    private readonly handlers!: TransactionHandler[];

    private registered: boolean = false;

    public isRegistrationRequired(): boolean {
        return this.registered === false;
    }

    public registerHandlers() {
        for (const handler of this.handlers) {
            this.registerHandler(handler);
        }
        this.registered = true;
    }

    private registerHandler(handler: TransactionHandler) {
        const transactionConstructor = handler.getConstructor();
        Utils.assert.defined<number>(transactionConstructor.type);
        Utils.assert.defined<number>(transactionConstructor.typeGroup);
        const internalType = Transactions.InternalTransactionType.from(
            transactionConstructor.type,
            transactionConstructor.typeGroup,
        );

        if (this.hasOtherHandlerHandling(handler, internalType, transactionConstructor.version)) {
            throw new AlreadyRegisteredError(internalType);
        }

        for (const dependency of handler.dependencies()) {
            if (this.hasOtherHandlerInstance(handler, dependency) === false) {
                throw new UnsatisfiedDependencyError(internalType);
            }
        }

        for (const attribute of handler.walletAttributes()) {
            if (!this.attributeSet.has(attribute)) {
                this.attributeSet.set(attribute);
            }
        }

        if (transactionConstructor.typeGroup !== Enums.TransactionTypeGroup.Core) {
            Transactions.TransactionRegistry.registerTransactionType(transactionConstructor);
        }
    }

    private hasOtherHandlerHandling(
        handler: TransactionHandler,
        internalType: Transactions.InternalTransactionType,
        version: number,
    ) {
        for (const otherHandler of this.handlers) {
            if (otherHandler === handler) continue;

            const otherTransactionConstructor = otherHandler.getConstructor();
            Utils.assert.defined<number>(otherTransactionConstructor.type);
            Utils.assert.defined<number>(otherTransactionConstructor.typeGroup);
            const otherInternalType = Transactions.InternalTransactionType.from(
                otherTransactionConstructor.type,
                otherTransactionConstructor.typeGroup,
            );

            if (otherInternalType === internalType && otherTransactionConstructor.version === version) {
                return true;
            }
        }

        return false;
    }

    private hasOtherHandlerInstance(handler: TransactionHandler, dependency: TransactionHandlerConstructor) {
        return this.handlers.some(otherHandler => {
            return otherHandler !== handler && otherHandler.constructor === dependency;
        });
    }
}
