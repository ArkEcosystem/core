import "jest-extended";

import { Services } from "@packages/core-kernel";
import { Application } from "@packages/core-kernel/src/application";
import { Container, Identifiers } from "@packages/core-kernel/src/ioc";
import {
    DeactivatedTransactionHandlerError,
    InvalidTransactionTypeError,
} from "@packages/core-transactions/src/errors";
import { One, TransactionHandler, TransactionHandlerConstructor, Two } from "@packages/core-transactions/src/handlers";
import { TransactionHandlerProvider } from "@packages/core-transactions/src/handlers/handler-provider";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { ServiceProvider } from "@packages/core-transactions/src/service-provider";
import { Crypto, Enums, Identities, Interfaces, Managers, Transactions, Utils } from "@packages/crypto";
import { TransactionSchema } from "@packages/crypto/src/transactions/types/schemas";
import ByteBuffer from "bytebuffer";

let app: Application;

const NUMBER_OF_REGISTERED_CORE_HANDLERS = 16;
const NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE = 9; // TODO: Check if correct
const NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE = 12;

const TEST_TRANSACTION_TYPE = 100;
const DEPENDANT_TEST_TRANSACTION_TYPE = 101;
const { schemas } = Transactions;

abstract class TestTransaction extends Transactions.Transaction {
    public static type: number = TEST_TRANSACTION_TYPE;
    public static typeGroup: number = Enums.TransactionTypeGroup.Test;
    public static key: string = "test";

    deserialize(buf: ByteBuffer): void {}

    serialize(): ByteBuffer | undefined {
        return undefined;
    }

    public static getSchema(): TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "test",
        });
    }
}

abstract class TestWithDependencyTransaction extends Transactions.Transaction {
    public static type: number = DEPENDANT_TEST_TRANSACTION_TYPE;
    public static typeGroup: number = Enums.TransactionTypeGroup.Test;
    public static key: string = "test_with_dependency";

    deserialize(buf: ByteBuffer): void {}

    serialize(): ByteBuffer | undefined {
        return undefined;
    }

    public static getSchema(): TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "test_with_dependency",
        });
    }
}

class TestTransactionHandler extends TransactionHandler {
    dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [];
    }

    walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    getConstructor(): Transactions.TransactionConstructor {
        return TestTransaction;
    }

    async bootstrap(): Promise<void> {
        return;
    }

    async isActivated(): Promise<boolean> {
        return true;
    }

    async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}

class TestWithDependencyTransactionHandler extends TransactionHandler {
    dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [TestTransactionHandler];
    }

    walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    getConstructor(): Transactions.TransactionConstructor {
        return TestWithDependencyTransaction;
    }

    async bootstrap(): Promise<void> {
        return;
    }

    async isActivated(): Promise<boolean> {
        return true;
    }

    async applyToRecipient(transaction: Interfaces.ITransaction): Promise<void> {}

    async revertForRecipient(transaction: Interfaces.ITransaction): Promise<void> {}
}

beforeEach(() => {
    app = new Application(new Container());
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(null);
    app.bind(Identifiers.ApplicationNamespace).toConstantValue("ark-unitnet");
    app.bind(Identifiers.LogService).toConstantValue({});

    app.bind<Services.Attributes.AttributeSet>(Identifiers.WalletAttributes)
        .to(Services.Attributes.AttributeSet)
        .inSingletonScope();
    app.bind(Identifiers.DatabaseBlockRepository).toConstantValue({});
    app.bind(Identifiers.DatabaseTransactionRepository).toConstantValue({});
    app.bind(Identifiers.WalletRepository).toConstantValue({});
    app.bind(Identifiers.TransactionPoolQuery).toConstantValue({});

    app.bind(Identifiers.TransactionHandler).to(One.TransferTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.TransferTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.SecondSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.SecondSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.DelegateRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.DelegateRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.VoteTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.VoteTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(One.MultiSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.MultiSignatureRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.IpfsTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.MultiPaymentTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.DelegateResignationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcLockTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcClaimTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(Two.HtlcRefundTransactionHandler);

    app.bind(Identifiers.TransactionHandlerProvider).to(TransactionHandlerProvider).inSingletonScope();
    app.bind(Identifiers.TransactionHandlerRegistry).to(TransactionHandlerRegistry).inSingletonScope();
    app.bind(Identifiers.TransactionHandlerConstructors).toDynamicValue(
        ServiceProvider.getTransactionHandlerConstructorsBinding(),
    );

    Managers.configManager.getMilestone().aip11 = false;
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(TestTransaction);
    } catch {}
});

describe("Registry", () => {
    it("should register core transaction types", async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );

        await expect(
            Promise.all([
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.Transfer,
                        Enums.TransactionTypeGroup.Core,
                    ),
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.Transfer,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.SecondSignature,
                        Enums.TransactionTypeGroup.Core,
                    ),
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.SecondSignature,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.DelegateRegistration,
                        Enums.TransactionTypeGroup.Core,
                    ),
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.DelegateRegistration,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.Vote,
                        Enums.TransactionTypeGroup.Core,
                    ),
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.Vote,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.MultiSignature,
                        Enums.TransactionTypeGroup.Core,
                    ),
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.MultiSignature,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.Ipfs,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.MultiPayment,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.DelegateRegistration,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.HtlcLock,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.HtlcClaim,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
                transactionHandlerRegistry.getRegisteredHandlerByType(
                    Transactions.InternalTransactionType.from(
                        Enums.TransactionType.HtlcRefund,
                        Enums.TransactionTypeGroup.Core,
                    ),
                    2,
                ),
            ]),
        ).toResolve();
    });

    it("should skip handler registration if provider handlerProvider is already registered", async () => {
        const transactionHandlerProvider = app.get<TransactionHandlerProvider>(Identifiers.TransactionHandlerProvider);

        transactionHandlerProvider.isRegistrationRequired = jest.fn().mockReturnValue(false);
        transactionHandlerProvider.registerHandlers = jest.fn();

        app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

        expect(transactionHandlerProvider.registerHandlers).not.toHaveBeenCalled();
    });

    it("should register a custom type", async () => {
        app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);

        expect(() => {
            app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        }).not.toThrowError();
    });

    it("should register a custom type with dependency", async () => {
        app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
        app.bind(Identifiers.TransactionHandler).to(TestWithDependencyTransactionHandler);

        expect(() => {
            app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        }).not.toThrowError();
    });

    it("should register a custom type with missing dependency", async () => {
        app.bind(Identifiers.TransactionHandler).to(TestWithDependencyTransactionHandler);

        expect(() => {
            app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        }).toThrowError();
    });

    it("should be able to return handler by data", async () => {
        app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );

        const keys = Identities.Keys.fromPassphrase("secret");
        const data: Interfaces.ITransactionData = {
            version: 1,
            typeGroup: Enums.TransactionTypeGroup.Test,
            type: TEST_TRANSACTION_TYPE,
            nonce: Utils.BigNumber.ONE,
            timestamp: Crypto.Slots.getTime(),
            senderPublicKey: keys.publicKey,
            fee: Utils.BigNumber.make("10000000"),
            amount: Utils.BigNumber.make("200000000"),
            recipientId: "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq",
            asset: {
                test: 256,
            },
        };

        expect(await transactionHandlerRegistry.getActivatedHandlerForData(data)).toBeInstanceOf(
            TestTransactionHandler,
        );
    });

    it("should throw when registering the same key twice", async () => {
        app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
        app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);

        expect(() => {
            app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);
        }).toThrow();
    });

    it("should return all registered core handlers", async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );

        expect(transactionHandlerRegistry.getRegisteredHandlers().length).toBe(NUMBER_OF_REGISTERED_CORE_HANDLERS);
    });

    it("should return all registered core and custom handlers", async () => {
        app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );

        expect(transactionHandlerRegistry.getRegisteredHandlers().length).toBe(NUMBER_OF_REGISTERED_CORE_HANDLERS + 1);
    });

    it("should return all active core handlers", async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );

        expect((await transactionHandlerRegistry.getActivatedHandlers()).length).toBe(
            NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE,
        );

        Managers.configManager.getMilestone().aip11 = true;
        expect((await transactionHandlerRegistry.getActivatedHandlers()).length).toBe(
            NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE,
        );
    });

    it("should return all active core and custom handlers", async () => {
        app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );

        expect((await transactionHandlerRegistry.getActivatedHandlers()).length).toBe(
            NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_FALSE + 1,
        );

        Managers.configManager.getMilestone().aip11 = true;
        expect((await transactionHandlerRegistry.getActivatedHandlers()).length).toBe(
            NUMBER_OF_ACTIVE_CORE_HANDLERS_AIP11_IS_TRUE + 1,
        );
    });

    it("should return a registered custom handler", async () => {
        app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );

        const internalTransactionType = Transactions.InternalTransactionType.from(
            TEST_TRANSACTION_TYPE,
            Enums.TransactionTypeGroup.Test,
        );
        expect(transactionHandlerRegistry.getRegisteredHandlerByType(internalTransactionType)).toBeInstanceOf(
            TestTransactionHandler,
        );

        const invalidInternalTransactionType = Transactions.InternalTransactionType.from(
            999,
            Enums.TransactionTypeGroup.Test,
        );

        expect(() => {
            transactionHandlerRegistry.getRegisteredHandlerByType(invalidInternalTransactionType);
        }).toThrow(InvalidTransactionTypeError);
    });

    it("should return a activated custom handler", async () => {
        app.bind(Identifiers.TransactionHandler).to(TestTransactionHandler);
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );

        const internalTransactionType = Transactions.InternalTransactionType.from(
            TEST_TRANSACTION_TYPE,
            Enums.TransactionTypeGroup.Test,
        );
        expect(await transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType)).toBeInstanceOf(
            TestTransactionHandler,
        );

        const invalidInternalTransactionType = Transactions.InternalTransactionType.from(
            999,
            Enums.TransactionTypeGroup.Test,
        );
        await expect(
            transactionHandlerRegistry.getActivatedHandlerByType(invalidInternalTransactionType),
        ).rejects.toThrow(InvalidTransactionTypeError);
    });

    it("should not return deactivated custom handler", async () => {
        const transactionHandlerRegistry: TransactionHandlerRegistry = app.get<TransactionHandlerRegistry>(
            Identifiers.TransactionHandlerRegistry,
        );
        const internalTransactionType = Transactions.InternalTransactionType.from(
            Enums.TransactionType.DelegateResignation,
            Enums.TransactionTypeGroup.Core,
        );

        Managers.configManager.getMilestone().aip11 = false;
        await expect(transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType, 2)).rejects.toThrow(
            DeactivatedTransactionHandlerError,
        );

        Managers.configManager.getMilestone().aip11 = true;
        expect(await transactionHandlerRegistry.getActivatedHandlerByType(internalTransactionType, 2)).toBeInstanceOf(
            Two.DelegateResignationTransactionHandler,
        );
    });
});
