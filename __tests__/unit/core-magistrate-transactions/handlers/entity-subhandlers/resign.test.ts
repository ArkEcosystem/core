import "jest-extended";

import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Application } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { EntityBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { EntityTransactionHandler } from "@packages/core-magistrate-transactions/src/handlers";
import { BusinessRegistrationTransactionHandler } from "@packages/core-magistrate-transactions/src/handlers";
import { EntityResignSubHandler } from "@packages/core-magistrate-transactions/src/handlers/entity-subhandlers/resign";
import { Wallets } from "@packages/core-state";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Managers, Transactions } from "@packages/crypto";
import { Entity } from "../__fixtures__/";

import { buildSenderWallet, initApp } from "../../__support__/app";

let app: Application;
let handler: EntityResignSubHandler;
let walletRepository;
let wallet;
let transaction;

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
        ["521e69c181e53ec1e4efbe5b67509b70548debf23df150bb7ca97e233be9dc6b"]: Entity.validRegisters[0],
    });

    walletRepository.index(wallet);

    handler = app.resolve(EntityResignSubHandler);

    const builder = new EntityBuilder();
    transaction = builder.asset(Entity.validResigns[0]).sign(passphrases[0]).build();
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

        it("should throw if asset is undefined", async () => {
            transaction.data.asset = undefined;

            await expect(handler.throwIfCannotBeApplied(transaction, wallet, walletRepository)).rejects.toThrow();
        });

        it("should throw if asset.registrationId is undefined", async () => {
            transaction.data.asset.registrationId = undefined;

            await expect(handler.throwIfCannotBeApplied(transaction, wallet, walletRepository)).rejects.toThrow();
        });
    });

    describe("emitEvents", () => {
        it("should be ok", async () => {
            // @ts-ignore
            handler.emitEvents(transaction, {});
        });
    });

    describe("applyToSender", () => {
        it("should be ok", async () => {
            await expect(handler.applyToSender(transaction, walletRepository)).toResolve();
        });

        it("should be ok if registered entity with same registrationId doesn't exist", async () => {
            wallet.setAttribute("entities", {
                ["dummy_registration_id"]: Entity.validRegisters[0],
            });

            await expect(handler.applyToSender(transaction, walletRepository)).toResolve();
        });

        it("should throw if asset is missing", async () => {
            transaction.data.asset = undefined;

            await expect(handler.applyToSender(transaction, walletRepository)).rejects.toThrow();
        });

        it("should throw if asset.registrationId is missing", async () => {
            transaction.data.asset.registrationId = undefined;

            await expect(handler.applyToSender(transaction, walletRepository)).rejects.toThrow();
        });
    });

    describe("revertForSender", () => {
        it("should be ok if registered entity with same registrationId doesn't exist", async () => {
            wallet.setAttribute("entities", {
                ["dummy_registration_id"]: Entity.validRegisters[0],
            });

            // @ts-ignore
            await expect(handler.revertForSender(transaction, walletRepository, undefined)).toResolve();
        });

        it("should throw if asset is missing", async () => {
            transaction.data.asset = undefined;

            await expect(
                // @ts-ignore
                handler.revertForSender(transaction, walletRepository, transactionHistoryService),
            ).rejects.toThrow();
        });

        it("should throw if asset.registrationId is missing", async () => {
            transaction.data.asset.registrationId = undefined;

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
