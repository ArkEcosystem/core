import "jest-extended";

import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Application } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { EntityBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { EntityAction, EntitySubType, EntityType } from "@packages/core-magistrate-crypto/src/enums";
import { EntityTransactionHandler } from "@packages/core-magistrate-transactions/src/handlers";
import { BusinessRegistrationTransactionHandler } from "@packages/core-magistrate-transactions/src/handlers";
import { EntityResignSubHandler } from "@packages/core-magistrate-transactions/src/handlers/entity-subhandlers/resign";
import { Wallets } from "@packages/core-state";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Managers, Transactions } from "@packages/crypto";

import { buildSenderWallet, initApp } from "../../__support__/app";

let app: Application;
let handler: EntityResignSubHandler;
let walletRepository;
let wallet;
let transaction;

const resignAsset = {
    type: EntityType.Business,
    subType: EntitySubType.None,
    action: EntityAction.Resign,
    registrationId: "1111111111111111111111111111111111111111111111111111111111111111",
    data: {},
};

const transactionHistoryService = {
    streamByCriteria: jest.fn(),
};

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    app = initApp();

    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(EntityTransactionHandler);

    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    wallet = buildSenderWallet(app);

    wallet.setAttribute("entities", {
        ["1111111111111111111111111111111111111111111111111111111111111111"]: {
            type: EntityType.Business,
            subType: EntitySubType.None,
            data: {
                name: "my_business_1",
                ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ",
            },
        },
    });

    walletRepository.index(wallet);

    handler = app.resolve(EntityResignSubHandler);

    const builder = new EntityBuilder();
    transaction = builder.asset(resignAsset).sign(passphrases[0]).build();
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        Transactions.TransactionRegistry.deregisterTransactionType(MagistrateTransactions.EntityTransaction);
    } catch {}
});

describe("EntityResignSubHandler", () => {
    describe("bootstrap", () => {
        it("should resolve", async () => {
            transactionHistoryService.streamByCriteria.mockImplementationOnce(async function* () {
                yield transaction.data;
            });

            const spyOnFindByPublicKey = jest.spyOn(walletRepository, "findByPublicKey").mockReturnValue(wallet);

            // @ts-ignore
            await expect(handler.bootstrap(walletRepository, transactionHistoryService, {})).toResolve();

            spyOnFindByPublicKey.mockReset();
        });
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(transaction, wallet, walletRepository)).toResolve();
        });

        it("should throw if transaction registrationId is missing", async () => {
            delete transaction.data.asset.registrationId;

            await expect(handler.throwIfCannotBeApplied(transaction, wallet, walletRepository)).rejects.toThrow();
        });
    });

    describe("applyToSender", () => {
        it("should throw if registrationId is missing", async () => {
            delete transaction.data.asset.registrationId;

            await expect(handler.applyToSender(transaction, walletRepository)).rejects.toThrow();
        });
    });

    describe("revertForSender", () => {
        it("should throw if registrationId is missing", async () => {
            delete transaction.data.asset.registrationId;

            await expect(
                // @ts-ignore
                handler.revertForSender(transaction, walletRepository, transactionHistoryService),
            ).rejects.toThrow();
        });
    });

    describe("applyToRecipient", () => {
        it("should resolve", async () => {
            await expect(handler.applyToRecipient(transaction, walletRepository)).toResolve();
        });
    });

    describe("revertForRecipient", () => {
        it("should resolve", async () => {
            await expect(handler.revertForRecipient(transaction, walletRepository)).toResolve();
        });
    });
});
