import "jest-extended";

import { Container, Utils } from "@packages/core-kernel";
import { PoolError } from "@packages/core-kernel/dist/contracts/transaction-pool";
import { Enums } from "@packages/core-magistrate-crypto";
import { EntityBuilder } from "@packages/core-magistrate-crypto/src/builders";
import { EntityAction, EntityType } from "@packages/core-magistrate-crypto/src/enums";
import { EntityTransaction } from "@packages/core-magistrate-crypto/src/transactions";
import {
    EntityAlreadyRegisteredError,
    EntityAlreadyResignedError,
    EntityNameAlreadyRegisteredError,
    EntityNameDoesNotMatchDelegateError,
    EntityNotRegisteredError,
    EntitySenderIsNotDelegateError,
    EntityWrongSubTypeError,
    EntityWrongTypeError,
    StaticFeeMismatchError,
} from "@packages/core-magistrate-transactions/src/errors";
import { EntityTransactionHandler } from "@packages/core-magistrate-transactions/src/handlers/entity";
import { Utils as CryptoUtils } from "@packages/crypto";
import { Managers, Transactions } from "@packages/crypto";
import { cloneDeep } from "lodash";

import { validRegisters, validResigns, validUpdates } from "./__fixtures__/entity";
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

    const poolQuery = {
        getAll: jest.fn(),
        whereKind: jest.fn(),
        wherePredicate: jest.fn(),
        has: jest.fn().mockReturnValue(false),
    };

    poolQuery.getAll.mockReturnValue(poolQuery);
    poolQuery.whereKind.mockReturnValue(poolQuery);
    poolQuery.wherePredicate.mockReturnValue(poolQuery);

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);
        container.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue(poolQuery);
    });

    let wallet, walletAttributes;
    beforeEach(() => {
        walletAttributes = {};
        wallet = {
            getAttribute: jest.fn().mockImplementation((attribute, defaultValue) => {
                const splitAttribute = attribute.split(".");
                return splitAttribute.length === 1
                    ? walletAttributes[splitAttribute[0]] || defaultValue
                    : (walletAttributes[splitAttribute[0]] || {})[splitAttribute[1]] || defaultValue;
            }),
            hasAttribute: jest.fn().mockImplementation((attribute) => {
                const splitAttribute = attribute.split(".");
                return splitAttribute.length === 1
                    ? !!walletAttributes[splitAttribute[0]]
                    : !!walletAttributes[splitAttribute[0]] && !!walletAttributes[splitAttribute[0]][splitAttribute[1]];
            }),
            setAttribute: jest.fn().mockImplementation((attribute, value) => (walletAttributes[attribute] = value)),
            forgetAttribute: jest.fn().mockImplementation((attribute) => delete walletAttributes[attribute]),
        };

        jest.spyOn(walletRepository, "findByPublicKey").mockReturnValue(wallet);

        entityHandler = container.resolve(EntityTransactionHandler);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const registerFee = "5000000000";
    const updateAndResignFee = "500000000";

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
            Managers.configManager.setHeight(61);

            entityHandler = container.resolve(EntityTransactionHandler);
            const result = await entityHandler.isActivated();
            expect(result).toBeTrue();
        });
    });

    describe("dynamicFee", () => {
        const registerTx = new EntityBuilder().asset(validRegisters[0]).sign("passphrase").build();
        const updateTx = new EntityBuilder().asset(validUpdates[0]).sign("passphrase").build();
        const resignTx = new EntityBuilder().asset(validResigns[0]).sign("passphrase").build();
        it.each([
            [registerTx, registerFee],
            [updateTx, updateAndResignFee],
            [resignTx, updateAndResignFee],
        ])("should return correct static fee", async (tx, fee) => {
            entityHandler = container.resolve(EntityTransactionHandler);
            // @ts-ignore
            const result = await entityHandler.dynamicFee({ transaction: tx });

            expect(result.toString()).toEqual(Utils.BigNumber.make(fee).toString());
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
            const setOnIndex = jest.spyOn(walletRepository, "setOnIndex");

            await expect(entityHandler.bootstrap()).toResolve();

            expect(setOnIndex).toHaveBeenCalledTimes(2); // EntityNamesTypes & Entities
        });
    });

    describe("throwIfCannotEnterPool", () => {
        let transaction: EntityTransaction;
        let entityHandler: EntityTransactionHandler;

        beforeEach(() => {
            const builder = new EntityBuilder();
            transaction = builder.asset(validRegisters[0]).sign("passphrase").build() as EntityTransaction;

            entityHandler = container.resolve(EntityTransactionHandler);
        });

        it("should resolve", async () => {
            await expect(entityHandler.throwIfCannotEnterPool(transaction)).toResolve();
            expect(poolQuery.getAll).toHaveBeenCalled();
        });

        it("should resolve if transaction action is update or resign", async () => {
            transaction.data.asset!.action = Enums.EntityAction.Update;

            await expect(entityHandler.throwIfCannotEnterPool(transaction)).toResolve();
            expect(poolQuery.getAll).not.toHaveBeenCalled();

            transaction.data.asset!.action = Enums.EntityAction.Resign;

            await expect(entityHandler.throwIfCannotEnterPool(transaction)).toResolve();
            expect(poolQuery.getAll).not.toHaveBeenCalled();
        });

        it("should throw if transaction with same type and name is already in the pool", async () => {
            poolQuery.has.mockReturnValue(true);

            await expect(entityHandler.throwIfCannotEnterPool(transaction)).rejects.toBeInstanceOf(PoolError);

            expect(poolQuery.wherePredicate).toHaveBeenCalledTimes(2);

            const transactionClone = cloneDeep(transaction);
            const wherePredicateCallback1 = poolQuery.wherePredicate.mock.calls[0][0];
            const wherePredicateCallback2 = poolQuery.wherePredicate.mock.calls[1][0];

            expect(wherePredicateCallback1(transactionClone)).toBeTrue();
            expect(wherePredicateCallback2(transactionClone)).toBeTrue();

            delete transactionClone.data.asset;
            expect(wherePredicateCallback1(transactionClone)).toBeFalse();
            expect(wherePredicateCallback2(transactionClone)).toBeFalse();
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
                const setOnIndex = jest.spyOn(walletRepository, "setOnIndex");

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

                expect(setOnIndex).toHaveBeenCalledTimes(2); // EntityNamesTypes & Entities
            });
        });

        describe("revertForSender", () => {
            it.each([validRegisters])("should delete the wallet attribute", async (asset) => {
                const forgetOnIndex = jest.spyOn(walletRepository, "forgetOnIndex");

                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).sign("passphrase").build();

                // like the transaction was applied
                walletAttributes = { entities: { [transaction.id]: { ...asset.data } } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await entityHandler.revertForSender(transaction);

                expect(wallet.setAttribute).toBeCalledWith("entities", {});
                expect(walletAttributes).toEqual({ entities: {} });

                expect(forgetOnIndex).toHaveBeenCalledTimes(2); // EntityNamesTypes & Entities
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

            it("should throw when fee does not match register fee", async () => {
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

            it.each([validRegisters])(
                "should throw when entity name is already registered for same type",
                async (asset) => {
                    const builder = new EntityBuilder();
                    const transaction = builder.asset(asset).sign("passphrase").build();

                    jest.spyOn(walletRepository, "hasByIndex").mockReturnValueOnce(true);

                    entityHandler = container.resolve(EntityTransactionHandler);
                    await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                        EntityNameAlreadyRegisteredError,
                    );
                },
            );

            it.each([validRegisters])(
                "should not throw when entity name is registered for a different type",
                async (asset) => {
                    const builder = new EntityBuilder();
                    const transaction = builder.asset(asset).sign("passphrase").build();

                    entityHandler = container.resolve(EntityTransactionHandler);
                    await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).toResolve();
                },
            );

            describe("Entity delegate", () => {
                const entityId = "533384534cd561fc17f72be0bb57bf39961954ba0741f53c08e3f463ef19118c";
                const type = EntityType.Delegate;
                const subType = 0;
                const createEntityDelegateTx = (name, action = EntityAction.Register) => {
                    const asset: any = { type, subType, action, data: { name } };
                    if (action !== EntityAction.Register) {
                        asset.registrationId = entityId;
                        asset.data = {};
                    }
                    if (action === EntityAction.Update) {
                        asset.data = { ipfsData: "Qmbw6QmF6tuZpyV6WyEsTmExkEG3rW4khbttQidPfbpmNZ" };
                    }

                    return new EntityBuilder()
                        .asset(asset)
                        .fee(action === EntityAction.Register ? registerFee : updateAndResignFee)
                        .sign("passphrase")
                        .build();
                };

                it("should throw when the sender wallet is not a delegate", async () => {
                    const transaction = createEntityDelegateTx("anyname");

                    await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                        EntitySenderIsNotDelegateError,
                    );
                });

                it("should throw when the sender delegate name does not match the entity name", async () => {
                    const username = "thedelegate";
                    const transaction = createEntityDelegateTx(username);

                    walletAttributes.delegate = { username: username + "s" };

                    await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                        EntityNameDoesNotMatchDelegateError,
                    );
                });

                it("should not throw on update or resign even when delegate does not match", async () => {
                    // it should not throw because update or resign tx needs first a register tx
                    // for which the delegate checks must have already be done
                    const delegateName = "thedelegate";
                    const transactionResign = createEntityDelegateTx(delegateName, EntityAction.Resign);
                    const transactionUpdate = createEntityDelegateTx(delegateName, EntityAction.Update);

                    walletAttributes.entities = {
                        [entityId]: { name: "somename", type, subType, data: {} },
                    };

                    await expect(entityHandler.throwIfCannotBeApplied(transactionResign, wallet)).toResolve();
                    await expect(entityHandler.throwIfCannotBeApplied(transactionUpdate, wallet)).toResolve();
                });

                it("should not throw otherwise", async () => {
                    const username = "therealdelegate";
                    const transaction = createEntityDelegateTx(username);

                    walletAttributes.delegate = { username };

                    await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).toResolve();
                });
            });
        });
    });

    describe("resign", () => {
        describe("applyToSender", () => {
            it.each([validResigns])("should set the wallet entity attribute to resigned", async (asset) => {
                const setOnIndex = jest.spyOn(walletRepository, "setOnIndex");

                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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

                expect(setOnIndex).not.toHaveBeenCalled();
            });
        });

        describe("revertForSender", () => {
            it.each([validResigns])("should delete the wallet entity 'resigned' attribute", async (asset) => {
                const forgetOnIndex = jest.spyOn(walletRepository, "forgetOnIndex");

                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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

                expect(forgetOnIndex).not.toHaveBeenCalled();
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it.each([validResigns])("should throw when entity does not exist", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

                // entity does not exist
                walletAttributes = { entities: {} };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityNotRegisteredError,
                );
            });

            it.each([validResigns])("should throw when entity is already resigned", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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

            it("should throw when fee does not match resign fee", async () => {
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
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

                // entity exists and is not resigned, but has not the same type as the resign asset
                const entityNotResigned = {
                    type: (asset.type + 1) % 255, // different type but still in the range [0, 255]
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
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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
                const setOnIndex = jest.spyOn(walletRepository, "setOnIndex");

                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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

                expect(setOnIndex).not.toHaveBeenCalled();
            });
        });

        describe("revertForSender", () => {
            it.each([validUpdates])("should restore the wallet to its previous state", async (asset) => {
                const forgetOnIndex = jest.spyOn(walletRepository, "forgetOnIndex");

                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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

                expect(forgetOnIndex).not.toHaveBeenCalled();
            });
        });

        describe("throwIfCannotBeApplied", () => {
            it.each([validUpdates])("should throw when entity does not exist", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

                // entity does not exist
                walletAttributes = { entities: {} };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityNotRegisteredError,
                );
            });

            it.each([validUpdates])("should throw when entity is resigned", async (asset) => {
                const builder = new EntityBuilder();
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

                // entity exists and is not resigned, but has not the same type as the update asset
                const entityNotResigned = {
                    type: (asset.type + 1) % 255, // different type but still in the range [0, 255]
                    subType: asset.subType,
                    data: { name: "random name", description: "the current entity" },
                };
                walletAttributes = { entities: { [asset.registrationId]: entityNotResigned } };

                entityHandler = container.resolve(EntityTransactionHandler);
                await expect(entityHandler.throwIfCannotBeApplied(transaction, wallet)).rejects.toBeInstanceOf(
                    EntityWrongTypeError,
                );
            });

            it("should throw when fee does not match update fee", async () => {
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
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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
                const transaction = builder.asset(asset).fee(updateAndResignFee).sign("passphrase").build();

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
