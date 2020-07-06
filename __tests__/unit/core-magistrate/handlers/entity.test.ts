import "jest-extended";

import { Database, State } from "@arkecosystem/core-interfaces";
import { Builders as MagistrateBuilders, Enums } from "@arkecosystem/core-magistrate-crypto";
import { EntityAction, EntitySubType, EntityType } from "@arkecosystem/core-magistrate-crypto/src/enums";
import {
    EntityAlreadyRegisteredError,
    EntityAlreadyResignedError,
    EntityNotRegisteredError,
    EntityWrongSubTypeError,
    EntityWrongTypeError,
} from "@arkecosystem/core-magistrate-transactions/src/errors";
import { EntityTransactionHandler } from "@arkecosystem/core-magistrate-transactions/src/handlers";
import {
    EntityNameDoesNotMatchDelegateError,
    EntitySenderIsNotDelegateError,
} from "@arkecosystem/core-magistrate-transactions/src/handlers/entity-subhandlers/delegate/errors";
import { entityIndexer, MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-manager";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { validRegisters } from "./__fixtures__/entity/register";
import { validResigns } from "./__fixtures__/entity/resign";
import { validUpdates } from "./__fixtures__/entity/update";

// Mock database with walletManager
jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => {
                switch (name) {
                    case "database":
                        return {
                            walletManager,
                            connection,
                        };
                    default:
                        return {};
                }
            },
        },
    };
});

// Handler declarations
let entityHandler: Handlers.TransactionHandler;

// Builder declarations
let entityBuilder: MagistrateBuilders.EntityBuilder;

// Sender Wallet declaration
const senderPassphrase = "passphrase";
let senderWallet: Wallets.Wallet;

// Wallet Manager declaration
let walletManager: State.IWalletManager;

// Database connection declaration
const connection: Database.IConnection = {
    transactionsRepository: {
        search: jest.fn(),
    } as any,
} as Database.IConnection;

describe("Entity handler", () => {
    // Manager configurations
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2); // aip11 (v2 transactions) is true from height 2 on testnet

    // Handler registries
    Handlers.Registry.registerTransactionHandler(EntityTransactionHandler);

    beforeEach(() => {
        // Handler initializations
        entityHandler = new EntityTransactionHandler();

        // Builder initializations
        entityBuilder = new MagistrateBuilders.EntityBuilder();

        // Wallet Manager initialization
        walletManager = new Wallets.WalletManager();
        walletManager.registerIndex(MagistrateIndex.Entities, entityIndexer);

        // Sender Wallet initialization
        senderWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(senderPassphrase));
        senderWallet.balance = Utils.BigNumber.make(452765431200000);
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);

        walletManager.reindex(senderWallet);
    });

    describe("register", () => {
        describe("applyToSender", () => {
            it.each([validRegisters])("should set the wallet attribute", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .nonce("1")
                    .sign(senderPassphrase)
                    .build();

                await entityHandler.applyToSender(transaction, walletManager);

                expect(senderWallet.getAttributes()).toEqual({
                    entities: {
                        [transaction.id]: {
                            type: asset.type,
                            subType: asset.subType,
                            data: asset.data,
                        },
                    },
                });
            });
        });

        describe("revertForSender", () => {
            it.each([validRegisters])("should delete the wallet attribute", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // like the transaction was applied
                senderWallet.setAttribute("entities", { [transaction.id]: { ...asset.data } });
                walletManager.reindex(senderWallet);

                await entityHandler.revertForSender(transaction, walletManager);

                expect(senderWallet.getAttributes()).toEqual({ entities: {} });
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it.each([validRegisters])("should throw when entity is already registered", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity already registered
                senderWallet.setAttribute("entities", {
                    [transaction.id]: {
                        type: asset.type,
                        subType: asset.subType,
                        data: asset.data,
                    },
                });
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).rejects.toBeInstanceOf(EntityAlreadyRegisteredError);
            });

            it.each([validRegisters])("should not throw when entity is not registered", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).toResolve();
            });

            describe("Entity delegate", () => {
                const createEntityDelegateTx = name =>
                    entityBuilder
                        .asset({
                            type: EntityType.Delegate,
                            subType: EntitySubType.None,
                            action: EntityAction.Register,
                            data: { name },
                        })
                        .sign(senderPassphrase)
                        .build();

                it("should throw when the sender wallet is not a delegate", async () => {
                    const transaction = createEntityDelegateTx("anyname");

                    await expect(
                        entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                    ).rejects.toBeInstanceOf(EntitySenderIsNotDelegateError);
                });

                it("should throw when the sender delegate name does not match the entity name", async () => {
                    const transaction = createEntityDelegateTx("thedelegate");

                    senderWallet.setAttribute("delegate.username", "nothedelegatename");

                    await expect(
                        entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                    ).rejects.toBeInstanceOf(EntityNameDoesNotMatchDelegateError);
                });

                it("should not throw otherwise", async () => {
                    const delegateName = "therealdelegate";
                    const transaction = createEntityDelegateTx(delegateName);

                    senderWallet.setAttribute("delegate.username", delegateName);

                    await expect(
                        entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                    ).toResolve();
                });
            });
        });
    });

    describe("resign", () => {
        describe("applyToSender", () => {
            it.each([validResigns])("should set the wallet entity attribute to resigned", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .nonce("1")
                    .sign(senderPassphrase)
                    .build();

                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityNotResigned });
                walletManager.reindex(senderWallet);

                await entityHandler.applyToSender(transaction, walletManager);

                expect(senderWallet.getAttributes()).toEqual({
                    entities: { [asset.registrationId]: { ...entityNotResigned, resigned: true } },
                });
            });
        });

        describe("revertForSender", () => {
            it.each([validResigns])("should delete the wallet entity 'resigned' attribute", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // like the transaction was applied
                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                senderWallet.setAttribute("entities", {
                    [asset.registrationId]: { ...entityNotResigned, resigned: true },
                });
                walletManager.reindex(senderWallet);

                await entityHandler.revertForSender(transaction, walletManager);

                expect(senderWallet.getAttributes()).toEqual({
                    entities: { [asset.registrationId]: entityNotResigned },
                });
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it.each([validResigns])("should throw when entity does not exist", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity does not exist
                senderWallet.setAttribute("entities", {});
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).rejects.toBeInstanceOf(EntityNotRegisteredError);
            });

            it.each([validResigns])("should throw when entity is already resigned", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity already resigned
                const entityResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                    resigned: true,
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityResigned });
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).rejects.toBeInstanceOf(EntityAlreadyResignedError);
            });

            it.each([validResigns])("should throw when entity type does not match", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity exists and is not resigned, but has not the same type as the resign asset
                const entityNotResigned = {
                    type: asset.type === EntityType.Developer ? EntityType.Plugin : EntityType.Developer,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityNotResigned });
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).rejects.toBeInstanceOf(EntityWrongTypeError);
            });

            it.each([validResigns])("should throw when entity subType does not match", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity exists and is not resigned, but has not the same subtype as the resign asset
                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType === EntitySubType.None ? EntitySubType.PluginCore : EntitySubType.None,
                    data: { name: "random name", description: "the current entity" },
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityNotResigned });
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).rejects.toBeInstanceOf(EntityWrongSubTypeError);
            });

            it.each([validResigns])("should not throw otherwise", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity exists and is not resigned
                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityNotResigned });
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).toResolve();
            });
        });
    });

    describe("update", () => {
        describe("applyToSender", () => {
            it.each([validUpdates])("should apply the changes to the wallet entity", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .nonce("1")
                    .sign(senderPassphrase)
                    .build();

                const entityBefore = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityBefore });
                walletManager.reindex(senderWallet);

                const expectedEntityAfter = {
                    ...entityBefore,
                    data: {
                        ...entityBefore.data,
                        ...asset.data,
                    },
                };

                await entityHandler.applyToSender(transaction, walletManager);

                expect(senderWallet.getAttributes()).toEqual({
                    entities: { [asset.registrationId]: expectedEntityAfter },
                });
            });
        });

        describe("revertForSender", () => {
            it.each([validUpdates])("should restore the wallet to its previous state", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                const registrationTx = {
                    id: "e77a1d1d080ebce113dd17e1cb0a242ec8600fb72cd62eca4e46148bee1d3acc",
                    asset: {
                        type: asset.type,
                        subType: asset.subType,
                        action: Enums.EntityAction.Register,
                        data: { name: "random name", description: "the current entity" },
                    },
                };
                const updateTxs = [
                    {
                        id: "a11a1d1d080ebce113dd17e1cb0a242ec8600fb72cd62eca4e46148bee1d3acc",
                        asset: {
                            type: asset.type,
                            subType: asset.subType,
                            action: Enums.EntityAction.Update,
                            data: { description: "updated description", images: ["https://flickr.com/dummy"] },
                        },
                    },
                    {
                        id: "b22a1d1d080ebce113dd17e1cb0a242ec8600fb72cd62eca4e46148bee1d3acc",
                        asset: {
                            type: asset.type,
                            subType: asset.subType,
                            action: Enums.EntityAction.Update,
                            data: { description: "updated description 2", videos: ["https://youtube.com/dummy"] },
                        },
                    },
                    transaction, // the transaction that we are reverting
                ];
                connection.transactionsRepository.search = jest.fn().mockReturnValueOnce({
                    rows: [registrationTx, ...updateTxs],
                });

                await entityHandler.revertForSender(transaction, walletManager);

                expect(senderWallet.getAttributes()).toEqual({
                    entities: {
                        [asset.registrationId]: {
                            type: asset.type,
                            subType: asset.subType,
                            data: {
                                name: "random name",
                                description: "updated description 2",
                                images: ["https://flickr.com/dummy"],
                                videos: ["https://youtube.com/dummy"],
                            },
                        },
                    },
                });
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it.each([validUpdates])("should throw when entity does not exist", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity does not exist
                senderWallet.setAttribute("entities", {});
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).rejects.toBeInstanceOf(EntityNotRegisteredError);
            });

            it.each([validUpdates])("should throw when entity is resigned", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity resigned
                const entityResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                    resigned: true,
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityResigned });
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).rejects.toBeInstanceOf(EntityAlreadyResignedError);
            });

            it.each([validUpdates])("should throw when entity type does not match", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity exists and is not resigned, but has not the same type as the update asset
                const entityNotResigned = {
                    type: asset.type === EntityType.Developer ? EntityType.Plugin : EntityType.Developer,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityNotResigned });
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).rejects.toBeInstanceOf(EntityWrongTypeError);
            });

            it.each([validUpdates])("should throw when entity subType does not match", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity exists and is not resigned, but has not the same subtype as the update asset
                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType === EntitySubType.None ? EntitySubType.PluginCore : EntitySubType.None,
                    data: { name: "random name", description: "the current entity" },
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityNotResigned });
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).rejects.toBeInstanceOf(EntityWrongSubTypeError);
            });

            it.each([validUpdates])("should not throw otherwise", async asset => {
                const transaction = entityBuilder
                    .asset(asset)
                    .sign(senderPassphrase)
                    .build();

                // entity exists and is not resigned
                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                senderWallet.setAttribute("entities", { [asset.registrationId]: entityNotResigned });
                walletManager.reindex(senderWallet);

                await expect(
                    entityHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).toResolve();
            });
        });
    });
});
