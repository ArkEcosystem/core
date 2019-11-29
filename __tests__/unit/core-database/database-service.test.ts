import "jest-extended";
import "./mocks/core-container";

import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Blocks, Constants, Enums, Identities, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { DatabaseService } from "../../../packages/core-database/src/database-service";
import { Wallet, WalletManager } from "../../../packages/core-state/src/wallets";
import { roundCalculator } from "../../../packages/core-utils";
import { BlockFactory as TestBlockFactory } from "../../helpers/block-factory";
import { genesisBlock } from "../../utils/fixtures/testnet/block-model";
import { DatabaseConnectionStub } from "./__fixtures__/database-connection-stub";
import { stateStorageStub } from "./__fixtures__/state-storage-stub";

const { BlockFactory } = Blocks;
const { SATOSHI } = Constants;
const { TransactionType } = Enums;

let connection: Database.IConnection;
let databaseService: DatabaseService;
let walletManager: State.IWalletManager;
let container;
let emitter: EventEmitter.EventEmitter;

beforeAll(() => {
    container = app;
    // @ts-ignore
    emitter = container.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
    connection = new DatabaseConnectionStub();
    walletManager = new WalletManager();
});

beforeEach(() => {
    jest.restoreAllMocks();
});

const createService = () => {
    const service = new DatabaseService({}, connection, walletManager, undefined, undefined, undefined);
    service.emitter = emitter;

    return service;
};

describe("Database Service", () => {
    describe("applyBlock", () => {
        it("should applyBlock", async () => {
            jest.spyOn(walletManager, "applyBlock").mockImplementation(async block => undefined);
            jest.spyOn(emitter, "emit");

            databaseService = createService();
            jest.spyOn(databaseService, "applyRound").mockImplementation(() => undefined); // test applyRound logic separately
            jest.spyOn(stateStorageStub, "getLastBlock").mockReturnValueOnce(genesisBlock);

            await databaseService.applyBlock(genesisBlock);

            expect(walletManager.applyBlock).toHaveBeenCalledWith(genesisBlock);
            expect(emitter.emit).toHaveBeenCalledWith(ApplicationEvents.BlockApplied, genesisBlock.data);
            for (const tx of genesisBlock.transactions) {
                expect(emitter.emit).toHaveBeenCalledWith(ApplicationEvents.TransactionApplied, tx.data);
            }
        });
    });

    describe("revertBlock", () => {
        it("should revertBlock", async () => {
            jest.spyOn(walletManager, "revertBlock").mockImplementation(async block => undefined);
            jest.spyOn(emitter, "emit");

            databaseService = createService();
            jest.spyOn(databaseService, "revertRound").mockImplementation(() => undefined);

            databaseService.blocksInCurrentRound = [genesisBlock];
            await databaseService.revertBlock(genesisBlock);

            expect(walletManager.revertBlock).toHaveBeenCalledWith(genesisBlock);
            expect(emitter.emit).toHaveBeenCalledWith(ApplicationEvents.BlockReverted, genesisBlock.data);
            for (let i = genesisBlock.transactions.length - 1; i >= 0; i--) {
                expect(emitter.emit).toHaveBeenCalledWith(
                    ApplicationEvents.TransactionApplied,
                    genesisBlock.transactions[i].data,
                );
            }
        });
    });

    describe("getBlocksByHeight", () => {
        it("should deliver blocks for the given heights", async () => {
            const requestHeightsLow = [1, 5, 20];
            const requestHeightsHigh = [100, 200, 500];
            // @ts-ignore
            jest.spyOn(stateStorageStub, "getLastBlocksByHeight").mockImplementation((heightFrom, heightTo) => {
                if (requestHeightsHigh[0] <= heightFrom) {
                    return [{ height: heightFrom, fromState: true }];
                }
                return undefined;
            });
            jest.spyOn(container, "has").mockReturnValue(true);
            jest.spyOn(container, "resolve").mockReturnValue(stateStorageStub);

            databaseService = createService();

            connection.blocksRepository = {
                findByHeights: (heights: number[]) => heights.map(h => ({ height: Number(h), fromDb: true })),
            } as any; // FIXME: use Database.IBlocksRepository

            let requestHeights = requestHeightsHigh;

            let blocks = await databaseService.getBlocksByHeight(requestHeights);

            expect(stateStorageStub.getLastBlocksByHeight).toHaveBeenCalled();
            expect(blocks).toBeArray();
            expect(blocks.length).toBe(requestHeights.length);
            for (let i = 0; i < requestHeights.length; i++) {
                expect(blocks[i].height).toBe(requestHeights[i]);
                expect(blocks[i].fromState).toBe(true);
            }

            requestHeights = [...requestHeightsLow, ...requestHeightsHigh];

            blocks = await databaseService.getBlocksByHeight(requestHeights);

            expect(stateStorageStub.getLastBlocksByHeight).toHaveBeenCalled();
            expect(blocks).toBeArray();
            expect(blocks.length).toBe(requestHeights.length);
            for (let i = 0; i < requestHeights.length; i++) {
                expect(blocks[i].height).toBe(requestHeights[i]);
                if (requestHeightsHigh.includes(requestHeights[i])) {
                    expect(blocks[i].fromState).toBe(true);
                } else {
                    expect(blocks[i].fromDb).toBe(true);
                }
            }

            jest.spyOn(stateStorageStub, "getLastBlocksByHeight").mockImplementation(() => {
                return undefined;
            });

            blocks = await databaseService.getBlocksByHeight(requestHeights);

            expect(blocks).toBeArray();
            expect(blocks.length).toBe(requestHeights.length);
            for (let i = 0; i < requestHeights.length; i++) {
                expect(blocks[i].height).toBe(requestHeights[i]);
                expect(blocks[i].fromDb).toBe(true);
            }
        });
    });

    describe("getBlocksForRound", () => {
        it("should fetch blocks using lastBlock in state-storage", async () => {
            jest.spyOn(stateStorageStub, "getLastBlock").mockReturnValue(undefined);
            jest.spyOn(container, "has").mockReturnValue(true);
            jest.spyOn(container, "resolve").mockReturnValue(stateStorageStub);

            databaseService = createService();
            jest.spyOn(databaseService, "getLastBlock").mockReturnValue(undefined);

            const blocks = await databaseService.getBlocksForRound();

            expect(blocks).toBeEmpty();
            expect(stateStorageStub.getLastBlock).toHaveBeenCalled();
            expect(databaseService.getLastBlock).toHaveBeenCalled();
        });

        it("should fetch blocks using lastBlock in database", async () => {
            jest.spyOn(container, "has").mockReturnValue(false);

            databaseService = createService();
            jest.spyOn(databaseService, "getLastBlock").mockReturnValue(undefined);

            const blocks = await databaseService.getBlocksForRound();

            expect(blocks).toBeEmpty();
            expect(databaseService.getLastBlock).toHaveBeenCalled();
        });

        it("should fetch blocks from lastBlock height", async () => {
            databaseService = createService();

            const mockBlock = TestBlockFactory.createDummy();
            mockBlock.data.height = 51;

            // @ts-ignore
            jest.spyOn(databaseService, "getLastBlock").mockReturnValue(mockBlock);
            // @ts-ignore
            jest.spyOn(databaseService, "getBlocks").mockReturnValue([]);
            jest.spyOn(container, "has").mockReturnValue(false);

            const blocks = await databaseService.getBlocksForRound();

            expect(blocks).toBeEmpty();
            expect(databaseService.getBlocks).toHaveBeenCalledWith(
                1,
                container.getConfig().getMilestone(genesisBlock.data.height).activeDelegates,
            );
        });
    });

    /* TODO: Testing a method that's private. This needs a replacement by testing a public method instead */

    describe("calcPreviousActiveDelegates", () => {
        it("should calculate the previous delegate list", async () => {
            databaseService = createService();

            walletManager = new WalletManager();
            const initialHeight = 52;

            // Create delegates
            Managers.configManager.getMilestone().aip11 = false;
            for (const transaction of genesisBlock.transactions) {
                if (transaction.type === TransactionType.DelegateRegistration) {
                    const wallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
                    wallet.setAttribute("delegate", {
                        voteBalance: Utils.BigNumber.ONE,
                        username: Transactions.TransactionFactory.fromBytes(transaction.serialized).data.asset.delegate
                            .username,
                    });
                    wallet.address = Identities.Address.fromPublicKey(transaction.data.senderPublicKey);
                    walletManager.reindex(wallet);
                }
            }
            Managers.configManager.getMilestone().aip11 = true;

            const keys = {
                passphrase: "this is a secret passphrase",
                publicKey: "02c71ab1a1b5b7c278145382eb0b535249483b3c4715a4fe6169d40388bbb09fa7",
                privateKey: "dcf4ead2355090279aefba91540f32e93b15c541ecb48ca73071f161b4f3e2e3",
                address: "D64cbDctaiADEH7NREnvRQGV27bnb1v2kE",
                compressed: true,
            };

            // Beginning of round 2 with all delegates 0 vote balance.
            const roundInfo1 = roundCalculator.calculateRound(initialHeight);
            const delegatesRound2 = walletManager.loadActiveDelegateList(roundInfo1);

            // Prepare sender wallet
            const transactionHandler = await Handlers.Registry.get(TransactionType.Transfer);
            const originalApply = transactionHandler.throwIfCannotBeApplied;
            transactionHandler.throwIfCannotBeApplied = jest.fn();

            const sender = new Wallet(keys.address);
            sender.publicKey = keys.publicKey;
            sender.balance = Utils.BigNumber.make(1e12);
            sender.setAttribute("delegate", {
                voteBalance: Utils.BigNumber.ZERO,
                forgedFees: Utils.BigNumber.ZERO,
                forgedRewards: Utils.BigNumber.ZERO,
                producedBlocks: Utils.BigNumber.ZERO,
            });

            walletManager.reindex(sender);

            // Apply 51 blocks, where each increases the vote balance of a delegate to
            // reverse the current delegate order.
            const blocksInRound = [];
            for (let i = 0; i < 51; i++) {
                const voterKeys = Identities.Keys.fromPassphrase(`voter-${i}`);

                const transfer = Transactions.BuilderFactory.transfer()
                    .amount(
                        Utils.BigNumber.make(i + 1)
                            .times(SATOSHI)
                            .toFixed(),
                    )
                    .nonce(sender.nonce.plus(1).toFixed())
                    .recipientId(Identities.Address.fromPublicKey(voterKeys.publicKey))
                    .sign(keys.passphrase)
                    .build();

                // Vote for delegate
                walletManager.findByPublicKey(voterKeys.publicKey).setAttribute("vote", delegatesRound2[i].publicKey);

                const block = BlockFactory.make(
                    {
                        version: 0,
                        timestamp: 0,
                        previousBlock: genesisBlock.data.id,
                        height: initialHeight + i,
                        numberOfTransactions: 1,
                        totalAmount: transfer.data.amount,
                        totalFee: Utils.BigNumber.make(1),
                        reward: Utils.BigNumber.make(2),
                        payloadLength: 0,
                        payloadHash: "a".repeat(64),
                        transactions: [transfer.data],
                    },
                    keys,
                );

                block.data.generatorPublicKey = keys.publicKey;
                await walletManager.applyBlock(block);

                blocksInRound.push(block);
            }

            // The delegates from round 2 are now reversed in rank in round 3.
            const roundInfo2 = roundCalculator.calculateRound(initialHeight + 51);
            const delegatesRound3 = walletManager.loadActiveDelegateList(roundInfo2);

            for (let i = 0; i < delegatesRound3.length; i++) {
                expect(delegatesRound3[i].getAttribute<number>("delegate.rank")).toBe(i + 1);
                expect(delegatesRound3[i].publicKey).toBe(delegatesRound2[delegatesRound3.length - i - 1].publicKey);
            }

            // @ts-ignore
            jest.spyOn(databaseService, "getBlocksForRound").mockReturnValue(blocksInRound);
            databaseService.walletManager = walletManager;

            // Necessary for revertRound to not blow up.
            // @ts-ignore
            walletManager.allByUsername = jest.fn(() => {
                const usernames = walletManager.getIndex(State.WalletIndexes.Usernames).values() as any;
                usernames.push(sender);
                return usernames;
            });

            // Finally recalculate the round 2 list and compare against the original list
            const restoredDelegatesRound2: State.IWallet[] = await (databaseService as any).calcPreviousActiveDelegates(
                roundInfo2,
            );

            for (let i = 0; i < restoredDelegatesRound2.length; i++) {
                expect(restoredDelegatesRound2[i].getAttribute<number>("delegate.rank")).toBe(i + 1);
                expect(restoredDelegatesRound2[i].publicKey).toBe(delegatesRound2[i].publicKey);
            }

            transactionHandler.throwIfCannotBeApplied = originalApply;
        });
    });
});
