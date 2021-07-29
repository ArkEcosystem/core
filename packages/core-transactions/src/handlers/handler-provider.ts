import { Container, Services, Utils } from "@arkecosystem/core-kernel";
import { Enums, Transactions } from "@arkecosystem/crypto";

import { AlreadyRegisteredError, UnsatisfiedDependencyError } from "../errors";
import { TransactionHandlerConstructor } from "./transaction";

@Container.injectable()
export class TransactionHandlerProvider {
    @Container.inject(Container.Identifiers.WalletAttributes)
    private readonly attributeSet!: Services.Attributes.AttributeSet;

    @Container.inject(Container.Identifiers.TransactionHandlerConstructors)
    private readonly handlerConstructors!: TransactionHandlerConstructor[];

    private registered: boolean = false;

    public isRegistrationRequired(): boolean {
        return this.registered === false;
    }

    public registerHandlers(): void {
        for (const handlerConstructor of this.handlerConstructors) {
            this.registerHandler(handlerConstructor);
        }

        this.registered = true;
    }

    private registerHandler(handlerConstructor: TransactionHandlerConstructor) {
        const handler = new handlerConstructor();
        const transactionConstructor = handler.getConstructor();

        Utils.assert.defined<number>(transactionConstructor.type);
        Utils.assert.defined<number>(transactionConstructor.typeGroup);

        const internalType = Transactions.InternalTransactionType.from(
            transactionConstructor.type,
            transactionConstructor.typeGroup,
        );

        if (this.hasOtherHandlerHandling(handlerConstructor, internalType, transactionConstructor.version)) {
            throw new AlreadyRegisteredError(internalType);
        }

        for (const dependency of handler.dependencies()) {
            if (this.hasOtherHandler(handlerConstructor, dependency) === false) {
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
        handlerConstructor: TransactionHandlerConstructor,
        internalType: Transactions.InternalTransactionType,
        version: number,
    ) {
        for (const otherHandlerConstructor of this.handlerConstructors) {
            if (otherHandlerConstructor === handlerConstructor) continue;

            const otherHandler = new otherHandlerConstructor();
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

    private hasOtherHandler(
        handlerConstructor: TransactionHandlerConstructor,
        dependency: TransactionHandlerConstructor,
    ) {
        return this.handlerConstructors.some((otherHandlerConstructor) => {
            return otherHandlerConstructor !== handlerConstructor && otherHandlerConstructor === dependency;
        });
    }
}
