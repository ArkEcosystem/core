import "jest-extended";

import { Container, Utils, Services } from "@arkecosystem/core-kernel";
import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { EntityBuilder } from "@arkecosystem/core-magistrate-crypto/src/builders";
import { EntityType, EntityAction } from "@arkecosystem/core-magistrate-crypto/src/enums";
import { EntityTransaction } from "@arkecosystem/core-magistrate-crypto/src/transactions";
import {
    EntityAlreadyRegisteredError,
    EntityAlreadyResignedError,
    EntityNotRegisteredError,
    EntityWrongSubTypeError,
    EntityWrongTypeError,
    StaticFeeMismatchError,
    EntitySenderIsNotDelegateError,
    EntityNameDoesNotMatchDelegateError,
} from "@arkecosystem/core-magistrate-transactions/src/errors";
import { EntityTransactionHandler } from "@arkecosystem/core-magistrate-transactions/src/handlers/entity";
import { Utils as CryptoUtils, Identities } from "@arkecosystem/crypto";
import { Managers, Transactions } from "@arkecosystem/crypto";

import { validRegisters } from "./__fixtures__/entity/register";
import { validResigns } from "./__fixtures__/entity/resign";
import { validUpdates } from "./__fixtures__/entity/update";
import { walletRepository } from "./__mocks__/wallet-repository";

// mocking the abstract TransactionHandler class
// because I could not make it work using the real abstract class + custom ioc binding
jest.mock("@arkecosystem/core-transactions", () => ({
    Handlers: {
        TransactionHandler: require("./__mocks__/transaction-handler").TransactionHandler,
    },
    Errors: {
        TransactionError: require("./__mocks__/transaction-error").TransactionError,
    },
}));

describe("Entity handler", () => {
    Managers.configManager.setFromPreset("testnet");
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(EntityTransaction);

    let entityHandler: EntityTransactionHandler;

    const container = new Container.Container();

    const transactionHistoryService = {
        findOneByCriteria: jest.fn(),
        findManyByCriteria: jest.fn(),
        streamByCriteria: jest.fn(),
    };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);
    });

    let wallet, walletAttributes;
    beforeEach(() => {
        walletAttributes = {};
        wallet = {
            getAttribute: jest
                .fn()
                .mockImplementation((attribute, defaultValue) => walletAttributes[attribute] || defaultValue),
            setAttribute: jest.fn().mockImplementation((attribute, value) => (walletAttributes[attribute] = value)),
            forgetAttribute: jest.fn().mockImplementation((attribute) => delete walletAttributes[attribute]),
        };

        jest.spyOn(walletRepository, "findByPublicKey").mockReturnValue(wallet);
    });

    describe("dependencies", () => {
        it("should return empty array", async () => {
            entityHandler = container.resolve(EntityTransactionHandler);
            const result = entityHandler.dependencies();

            expect(result).toBeArray();
            expect(result.length).toBe(0);
        });
    });

    describe("isActivated", () => {
        afterAll(() => {
            Managers.configManager.setHeight(2);
        });

        it("should return false if AIP36 is not enabled", async () => {
            entityHandler = container.resolve(EntityTransactionHandler);
            const result = await entityHandler.isActivated();

            expect(result).toBeFalse();
        });

        it("should return true if AIP36 is enabled", async () => {
            Managers.configManager.setHeight(51);

            entityHandler = container.resolve(EntityTransactionHandler);
            const result = await entityHandler.isActivated();
            expect(result).toBeTrue();
        });
    });

    describe("dynamicFee", () => {
        it("should return 5000000000", async () => {
            entityHandler = container.resolve(EntityTransactionHandler);
            // @ts-ignore
            const result = await entityHandler.dynamicFee({ height: 5 });

            expect(result.toString()).toEqual(Utils.BigNumber.make(5000000000).toString());
        });
    });

    describe("walletAttributes", () => {
        it("should return entities attribute", async () => {
            entityHandler = container.resolve(EntityTransactionHandler);
            const result = await entityHandler.walletAttributes();

            expect(result).toEqual(["entities"]);
        });
    });

    describe("bootstrap", () => {
        let transaction;
        let entityHandler;

        beforeEach(() => {
            const builder = new EntityBuilder();
            transaction = builder.asset(validRegisters[0]).sign("passphrase").build();

            entityHandler = container.resolve(EntityTransactionHandler);

            transactionHistoryService.streamByCriteria
                .mockImplementationOnce(async function* () {
                    yield transaction.data;
                })
                .mockImplementation(async function* () {});
        });

        it("should resolve", async () => {
            await expect(entityHandler.bootstrap()).toResolve();
        });
    });

    describe("throwIfCannotBeApplied", () => {
        let transaction: EntityTransaction;
        let entityHandler: EntityTransactionHandler;

        beforeEach(() => {
            const builder = new EntityBuilder();
            transaction = builder.asset(validRegisters[0]).sign("passphrase").build() as EntityTransaction;

            entityHandler = container.resolve(EntityTransactionHandler);
        });

        it("should resolve", async () => {
            await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).toResolve();
        });

        it("should resolve if exception", async () => {
            const spyOnIsException = jest.spyOn(CryptoUtils, "isException");
            spyOnIsException.mockReturnValue(true);

            transaction.data.fee = Utils.BigNumber.make("4000");

            await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).toResolve();

            spyOnIsException.mockReset();
        });

        it("should throw on static fee mismatch", async () => {
            transaction.data.fee = Utils.BigNumber.make("4000");

            await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                StaticFeeMismatchError,
            );
        });

        it("should throw on wrong entity subtype", async () => {
            // @ts-ignore
            transaction.data.asset.subType = 9;

            await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                EntityWrongSubTypeError,
            );
        });
    });

    describe("emitEvents", () => {
        it("should not dispatch", async () => {
            const builder = new EntityBuilder();
            const transaction = builder.asset(validRegisters[0]).sign("passphrase").build();

            const emitter = {
                dispatch: jest.fn(),
            };

            entityHandler = container.resolve(EntityTransactionHandler);

            // @ts-ignore
            entityHandler.emitEvents(transaction, emitter);

            // Emitting is currently disabled on EntityTransactions
            expect(emitter.dispatch).toHaveBeenCalledTimes(0);
        });
    });

    describe("applyToRecipient", () => {
        it("should resolve", async () => {
            const builder = new EntityBuilder();
            const transaction = builder.asset(validRegisters[0]).sign("passphrase").build();

            entityHandler = container.resolve(EntityTransactionHandler);

            await expect(entityHandler.applyToRecipient(transaction)).toResolve();
        });
    });

    describe("revertForRecipient", () => {
        it("should resolve", async () => {
            const builder = new EntityBuilder();
            const transaction = builder.asset(validRegisters[0]).sign("passphrase").build();

            entityHandler = container.resolve(EntityTransactionHandler);

            await expect(entityHandler.revertForRecipient(transaction)).toResolve();
        });
    });

    describe("register", () => {
        describe("applyToSender", () => {
            it.each([validRegisters])("should set the wallet attribute", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                entityHandler = container.resolve(EntityTransactionHandler);
                await entityHandler.applyToSender(transaction);

                expect(wallet.setAttribute).toBeCalledWith("entities", {
                    [transaction.id]: {
                        type: asset.type,
                        subType: asset.subType,
                        data: asset.data,
                    },
                });
                expect(walletAttributes).toEqual({
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
            it.each([validRegisters])("should delete the wallet attribute", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // like the transaction was applied
                walletAttributes = { entities: { [transaction.id]: { ...asset.data } } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await entityHandler.revertForSender(transaction);

                expect(wallet.setAttribute).toBeCalledWith("entities", {});
                expect(walletAttributes).toEqual({ entities: {} });
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it.each([validRegisters])("should throw when entity is already registered", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity already registered
                walletAttributes = {
                    entities: {
                        [transaction.id]: {
                            type: asset.type,
                            subType: asset.subType,
                            data: asset.data,
                        },
                    },
                };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityAlreadyRegisteredError,
                );
            });

            it.each([validRegisters])("should not throw when entity is not registered", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).toResolve();
            });

            it("should throw when fee does not match register fee", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder
                    .asset({
                        type: Enums.EntityType.Business,
                        subType: 4,
                        action: Enums.EntityAction.Register,
                        data: { name: "thename", ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khattQidPfbpmNZ" },
                    })
                    .fee("500000000")
                    .sign("passphrase")
                    .build();

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    StaticFeeMismatchError,
                );
            });

            it.each([validRegisters])("should throw when entity name is already registered for same type", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                const walletSameEntityName = {
                    hasAttribute: () => true,
                    getAttribute: () => ({
                        "7950c6a0d096eeb4883237feec12b9f37f36ab9343ff3640904befc75ce32ec2": {
                            type: asset.type,
                            subType: (asset.subType + 1) % 255, // different subType but still in the range [0, 255]
                            data: asset.data,
                        }}),
                }
                //@ts-ignore
                jest.spyOn(walletRepository, "getIndex").mockReturnValueOnce([walletSameEntityName]);

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityAlreadyRegisteredError,
                );
            });

            it.each([validRegisters])("should not throw when entity name is registered for a different type", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                const walletSameEntityName = {
                    hasAttribute: () => true,
                    getAttribute: () => ({
                        "7950c6a0d096eeb4883237feec12b9f37f36ab9343ff3640904befc75ce32ec2": {
                            type: (asset.type + 1) % 255, // different type but still in the range [0, 255]
                            subType: asset.subType,
                            data: asset.data,
                        }}),
                }
                //@ts-ignore
                jest.spyOn(walletRepository, "getIndex").mockReturnValueOnce([walletSameEntityName]);

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).toResolve();
            });

            describe("Entity delegate", () => {
                const createEntityDelegateTx = name =>
                    (new EntityBuilder())
                        .asset({
                            type: EntityType.Delegate,
                            subType: 0,
                            action: EntityAction.Register,
                            data: { name },
                        })
                        .sign("passphrase")
                        .build();

                it("should throw when the sender wallet is not a delegate", async () => {
                    const transaction = createEntityDelegateTx("anyname");

                    await expect(
                        entityHandler.throwIfCannotBeApplied(transaction, wallet),
                    ).rejects.toBeInstanceOf(EntitySenderIsNotDelegateError);
                });

                it("should throw when the sender delegate name does not match the entity name", async () => {
                    const username = "thedelegate";
                    const transaction = createEntityDelegateTx(username);

                    walletAttributes.delegate.username = username + "s";

                    await expect(
                        entityHandler.throwIfCannotBeApplied(transaction, wallet),
                    ).rejects.toBeInstanceOf(EntityNameDoesNotMatchDelegateError);
                });

                it("should not throw otherwise", async () => {
                    const username = "therealdelegate";
                    const transaction = createEntityDelegateTx(username);

                    walletAttributes.delegate.username = username;

                    await expect(
                        entityHandler.throwIfCannotBeApplied(transaction, wallet),
                    ).toResolve();
                });
            })
        });
    });

    describe("resign", () => {
        describe("applyToSender", () => {
            it.each([validResigns])("should set the wallet entity attribute to resigned", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: entityNotResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await entityHandler.applyToSender(transaction);

                expect(wallet.setAttribute).toBeCalledWith("entities", {
                    [asset.registrationId]: { ...entityNotResigned, resigned: true },
                });

                expect(walletAttributes).toEqual({
                    entities: { [asset.registrationId]: { ...entityNotResigned, resigned: true } },
                });
            });
        });

        describe("revertForSender", () => {
            it.each([validResigns])("should delete the wallet entity 'resigned' attribute", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // like the transaction was applied
                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: { ...entityNotResigned, resigned: true } } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await entityHandler.revertForSender(transaction);

                expect(wallet.setAttribute).toBeCalledWith("entities", { [asset.registrationId]: entityNotResigned });
                expect(walletAttributes).toEqual({ entities: { [asset.registrationId]: entityNotResigned } });
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it.each([validResigns])("should throw when entity does not exist", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity does not exist
                walletAttributes = { entities: {} };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityNotRegisteredError,
                );
            });

            it.each([validResigns])("should throw when entity is already resigned", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity already resigned
                const entityResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                    resigned: true,
                };
                walletAttributes = { entities: { [asset.registrationId]: entityResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityAlreadyResignedError,
                );
            });

            it("should throw when fee does not match resign fee", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder
                    .asset({
                        type: Enums.EntityType.Business,
                        subType: 4,
                        action: Enums.EntityAction.Resign,
                        registrationId: "533384534cd561fc17f72be0bb57bf39961954ba0741f53c08e3f463ef19118c",
                        data: {},
                    })
                    .fee("5000000000")
                    .sign("passphrase")
                    .build();

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    StaticFeeMismatchError,
                );
            });

            it.each([validResigns])("should throw when entity type does not match", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity exists and is not resigned, but has not the same type as the resign asset
                const entityNotResigned = {
                    type: asset.type === EntityType.Developer ? EntityType.Plugin : EntityType.Developer,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: entityNotResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityWrongTypeError,
                );
            });

            it.each([validResigns])("should throw when entity subType does not match", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity exists and is not resigned, but has not the same subtype as the resign asset
                const entityNotResigned = {
                    type: asset.type,
                    subType: (asset.subType + 1) % 255, // different subType but still in the range [0, 255]
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: entityNotResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityWrongSubTypeError,
                );
            });

            it.each([validResigns])("should not throw otherwise", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity exists and is not resigned
                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: entityNotResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).toResolve();
            });
        });
    });

    describe("update", () => {
        describe("applyToSender", () => {
            it.each([validUpdates])("should apply the changes to the wallet entity", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                const entityBefore = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: entityBefore } };

                const expectedEntityAfter = {
                    ...entityBefore,
                    data: {
                        ...entityBefore.data,
                        ...asset.data,
                    },
                };

                entityHandler = container.resolve(EntityTransactionHandler);
                await entityHandler.applyToSender(transaction);

                expect(wallet.setAttribute).toBeCalledWith("entities", { [asset.registrationId]: expectedEntityAfter });

                expect(walletAttributes).toEqual({ entities: { [asset.registrationId]: expectedEntityAfter } });
            });
        });

        describe("revertForSender", () => {
            it.each([validUpdates])("should restore the wallet to its previous state", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

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
                transactionHistoryService.findOneByCriteria = jest.fn().mockReturnValueOnce(registrationTx);
                transactionHistoryService.findManyByCriteria = jest.fn().mockReturnValueOnce(updateTxs);

                entityHandler = container.resolve(EntityTransactionHandler);
                await entityHandler.revertForSender(transaction);

                expect(wallet.setAttribute).toBeCalledWith("entities", {
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
                });
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it.each([validUpdates])("should throw when entity does not exist", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity does not exist
                walletAttributes = { entities: {} };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityNotRegisteredError,
                );
            });

            it.each([validUpdates])("should throw when entity is resigned", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity resigned
                const entityResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                    resigned: true,
                };
                walletAttributes = { entities: { [asset.registrationId]: entityResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityAlreadyResignedError,
                );
            });

            it.each([validUpdates])("should throw when entity type does not match", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity exists and is not resigned, but has not the same type as the update asset
                const entityNotResigned = {
                    type: asset.type === EntityType.Developer ? EntityType.Plugin : EntityType.Developer,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: entityNotResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityWrongTypeError,
                );
            });

            it("should throw when fee does not match resign fee", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder
                    .asset({
                        type: Enums.EntityType.Business,
                        subType: 4,
                        action: Enums.EntityAction.Update,
                        registrationId: "533384534cd561fc17f72be0bb57bf39961954ba0741f53c08e3f463ef19118c",
                        data: { ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khbttQidPfbpmNZ" },
                    })
                    .fee("5000000000")
                    .sign("passphrase")
                    .build();

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    StaticFeeMismatchError,
                );
            });

            it.each([validUpdates])("should throw when entity subType does not match", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity exists and is not resigned, but has not the same subtype as the update asset
                const entityNotResigned = {
                    type: asset.type,
                    subType: (asset.subType + 1) % 255, // different subType but still in the range [0, 255]
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: entityNotResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityWrongSubTypeError,
                );
            });

            it.each([validUpdates])("should not throw otherwise", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // entity exists and is not resigned
                const entityNotResigned = {
                    type: asset.type,
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: entityNotResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).toResolve();
            });
        });
    });
});
