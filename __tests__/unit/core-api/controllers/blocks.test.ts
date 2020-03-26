import "jest-extended";

import Hapi from "@hapi/hapi";
import { BlocksController } from "@packages/core-api/src/controllers/blocks";
import { Block } from "@packages/core-database/src/models";
import { Application } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Wallets } from "@packages/core-state";
import { Mocks } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Identities, Interfaces, Transactions, Utils } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/src/transactions";

import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";

let app: Application;
let controller: BlocksController;
let walletRepository: Wallets.WalletRepository;

beforeEach(() => {
    app = initApp();

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<BlocksController>(BlocksController);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    Mocks.BlockRepository.setMockBlock(null);
    Mocks.BlockRepository.setMockBlocks([]);
    Mocks.TransactionRepository.setMockTransactions([]);
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BridgechainRegistrationTransaction,
        );
    } catch {}
});

describe("BlocksController", () => {
    let mockBlock: Partial<Block>;

    beforeEach(() => {
        mockBlock = {
            id: "17184958558311101492",
            version: 2,
            height: 2,
            timestamp: 2,
            reward: Utils.BigNumber.make("100"),
            totalFee: Utils.BigNumber.make("200"),
            totalAmount: Utils.BigNumber.make("300"),
            generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
        };

        const delegateWallet = buildSenderWallet(app);

        const delegateAttributes = {
            username: "delegate",
            voteBalance: Utils.BigNumber.make("200"),
            rank: 1,
            resigned: false,
            producedBlocks: 0,
            forgedFees: Utils.BigNumber.make("2"),
            forgedRewards: Utils.BigNumber.make("200"),
        };

        delegateWallet.setAttribute("delegate", delegateAttributes);

        walletRepository.index(delegateWallet);
    });

    describe("index", () => {
        it("should return last block from store", async () => {
            Mocks.BlockRepository.setMockBlocks([mockBlock]);

            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(mockBlock);
        });

        it("should return last block from store - transformed", async () => {
            Mocks.BlockRepository.setMockBlocks([mockBlock]);

            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: true,
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            // expect(response.results[0]).toEqual(mockBlock);
        });
    });

    describe("first", () => {
        it("should return first block from store", async () => {
            Mocks.StateStore.setMockBlock({ data: mockBlock } as Partial<Interfaces.IBlock>);

            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.first(request, undefined)) as ItemResponse;

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlock);
        });
    });

    describe("last", () => {
        it("should return last block from store", async () => {
            Mocks.Blockchain.setMockBlock({ data: mockBlock } as Partial<Interfaces.IBlock>);

            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.last(request, undefined)) as ItemResponse;

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlock);
        });
    });

    describe("show", () => {
        it("should return found block from store", async () => {
            Mocks.BlockRepository.setMockBlock(mockBlock);

            const request: Hapi.Request = {
                params: {
                    id: mockBlock.id,
                },
                query: {
                    transform: false,
                },
            };

            const response = (await controller.show(request, undefined)) as ItemResponse;

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlock);
        });

        it("should return error if block not found", async () => {
            const request: Hapi.Request = {
                params: {
                    id: mockBlock.id,
                },
                query: {
                    transform: false,
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Block not found");
        });
    });

    describe("transactions", () => {
        it("should return found transactions", async () => {
            Mocks.BlockRepository.setMockBlock(mockBlock);

            const transaction = BuilderFactory.transfer()
                .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
                .amount("10000000")
                .sign(passphrases[0])
                .nonce("1")
                .build();

            Mocks.TransactionRepository.setMockTransactions([transaction]);

            const request: Hapi.Request = {
                params: {
                    id: mockBlock.id,
                },
                query: {
                    transform: false,
                },
            };

            const response = (await controller.transactions(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    id: transaction.data.id,
                }),
            );
        });

        it("should return error if block not found", async () => {
            const request: Hapi.Request = {
                params: {
                    id: mockBlock.id,
                },
                query: {
                    transform: false,
                },
            };

            await expect(controller.transactions(request, undefined)).resolves.toThrowError("Block not found");
        });

        it("should return error if block does not have an id", async () => {
            const mockBlockWithoutId = Object.assign({}, mockBlock);
            delete mockBlockWithoutId.id;

            Mocks.Blockchain.setMockBlock({ data: mockBlockWithoutId } as Partial<Interfaces.IBlock>);

            const request: Hapi.Request = {
                params: {
                    id: mockBlock.id,
                },
                query: {
                    transform: false,
                },
            };

            await expect(controller.transactions(request, undefined)).resolves.toThrowError("Block not found");
        });
    });

    describe("search", () => {
        it("should return found blocks from store", async () => {
            Mocks.BlockRepository.setMockBlocks([mockBlock]);

            const request: Hapi.Request = {
                params: {
                    id: mockBlock.id,
                },
                query: {
                    transform: false,
                },
            };

            const response = (await controller.search(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(mockBlock);
        });
    });
});
