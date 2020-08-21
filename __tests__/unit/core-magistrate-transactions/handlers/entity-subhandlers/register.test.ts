import "jest-extended";

import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Application } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { EntityBuilder } from "@packages/core-magistrate-crypto/src/builders";
import {
    EntityAlreadyRegisteredError,
    EntityNameAlreadyRegisteredError,
} from "@packages/core-magistrate-transactions/src/errors";
import { EntityTransactionHandler } from "@packages/core-magistrate-transactions/src/handlers";
import { BusinessRegistrationTransactionHandler } from "@packages/core-magistrate-transactions/src/handlers";
import { EntityRegisterSubHandler } from "@packages/core-magistrate-transactions/src/handlers/entity-subhandlers/register";
import { Wallets } from "@packages/core-state";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Managers, Transactions } from "@packages/crypto";

import { validRegisters } from "../__fixtures__/entity/register";
import { buildSenderWallet, initApp } from "../../__support__/app";

let app: Application;
let handler: EntityRegisterSubHandler;
let walletRepository;
let wallet;
let transaction;

beforeEach(() => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    app = initApp();

    app.bind(Identifiers.TransactionHistoryService).toConstantValue({});

    app.bind(Identifiers.TransactionHandler).to(BusinessRegistrationTransactionHandler);
    app.bind(Identifiers.TransactionHandler).to(EntityTransactionHandler);

    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    wallet = buildSenderWallet(app);

    handler = app.resolve(EntityRegisterSubHandler);

    const builder = new EntityBuilder();
    transaction = builder.asset(validRegisters[0]).sign("passphrase").build();
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        Transactions.TransactionRegistry.deregisterTransactionType(MagistrateTransactions.EntityTransaction);
    } catch {}
});

describe("EntityRegisterSubHandler", () => {
    describe("throwIfCannotBeApplied", () => {
        it("should not throw if wallet have no entities", async () => {
            await expect(handler.throwIfCannotBeApplied(transaction, wallet, walletRepository)).toResolve();
        });

        it("should not throw if registering unique entity", async () => {
            wallet.setAttribute("entities", {
                ["dummy_id"]: {
                    type: transaction.data.asset.type,
                    subType: transaction.data.asset.subType,
                    data: {
                        name: "dummy_name",
                    },
                },
            });

            walletRepository.index(wallet);

            await expect(handler.throwIfCannotBeApplied(transaction, wallet, walletRepository)).toResolve();
        });

        it("should throw if entry with same transaction id is already registered", async () => {
            wallet.setAttribute("entities", {
                [transaction.id]: {
                    type: transaction.data.asset.type,
                    subType: transaction.data.asset.subType,
                    data: {
                        name: "dummy_name",
                    },
                },
            });

            walletRepository.index(wallet);

            await expect(handler.throwIfCannotBeApplied(transaction, wallet, walletRepository)).rejects.toBeInstanceOf(
                EntityAlreadyRegisteredError,
            );
        });

        it("should throw if entry with same name is already registered", async () => {
            wallet.setAttribute("entities", {
                ["dummy_id"]: {
                    type: transaction.data.asset.type,
                    subType: transaction.data.asset.subType,
                    data: {
                        name: transaction.data.asset.data.name,
                    },
                },
            });

            walletRepository.index(wallet);

            await expect(handler.throwIfCannotBeApplied(transaction, wallet, walletRepository)).rejects.toBeInstanceOf(
                EntityNameAlreadyRegisteredError,
            );
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
