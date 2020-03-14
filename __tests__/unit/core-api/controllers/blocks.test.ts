import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application, Container } from "@packages/core-kernel";
import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { BlocksController } from "@arkecosystem/core-api/src/controllers/blocks";
import { BlockchainMocks, BlockRepositoryMocks, StateStoreMocks, TransactionRepositoryMocks } from "./mocks";
import { Block } from "@arkecosystem/core-database/src/models";
import { Identities, Interfaces, Utils, Transactions } from "@arkecosystem/crypto";
import { BuilderFactory } from "@arkecosystem/crypto/src/transactions";
import passphrases from "@arkecosystem/core-test-framework/src/internal/passphrases.json";
import { Wallets } from "@arkecosystem/core-state";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { TransactionHandlerRegistry } from "@arkecosystem/core-transactions/src/handlers/handler-registry";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";

let app: Application;
let controller: BlocksController;
let walletRepository: Wallets.WalletRepository;

beforeEach(() => {
    app = initApp();

    app
        .unbind(Container.Identifiers.StateStore);
    app
        .bind(Container.Identifiers.StateStore)
        .toConstantValue(StateStoreMocks.stateStore);

    app
        .unbind(Container.Identifiers.BlockRepository);
    app
        .bind(Container.Identifiers.BlockRepository)
        .toConstantValue(BlockRepositoryMocks.blockRepository);

    app
        .unbind(Container.Identifiers.BlockchainService);
    app
        .bind(Container.Identifiers.BlockchainService)
        .toConstantValue(BlockchainMocks.blockchain);

    app
        .unbind(Container.Identifiers.TransactionRepository);
    app
        .bind(Container.Identifiers.TransactionRepository)
        .toConstantValue(TransactionRepositoryMocks.transactionRepository);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<BlocksController>(BlocksController);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    BlockRepositoryMocks.setMockBlock(null);
    BlockRepositoryMocks.setMockBlocks([]);
    TransactionRepositoryMocks.setMockTransactions([]);
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
            generatorPublicKey: Identities.PublicKey.fromPassphrase(passphrases[0])
        };

        let delegateWallet = buildSenderWallet(app);

        let delegateAttributes = {
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
            BlockRepositoryMocks.setMockBlocks([mockBlock]);

            let request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.index(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(mockBlock);
        });

        it("should return last block from store - transformed", async () => {
            BlockRepositoryMocks.setMockBlocks([mockBlock]);

            let request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: true
                }
            };

            let response = <PaginatedResponse>(await controller.index(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            // expect(response.results[0]).toEqual(mockBlock);
        });
    });

    describe("first", () => {
        it("should return first block from store", async () => {
            StateStoreMocks.setMockBlock({data: mockBlock} as Partial<Interfaces.IBlock>);

            let request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <ItemResponse>(await controller.first(request, undefined));

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlock);
        });
    });

    describe("last", () => {
        it("should return last block from store", async () => {
            BlockchainMocks.setMockBlock({data: mockBlock} as Partial<Interfaces.IBlock>);

            let request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <ItemResponse>(await controller.last(request, undefined));

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlock);
        });
    });

    describe("show", () => {
        it("should return found block from store", async () => {
            BlockRepositoryMocks.setMockBlock(mockBlock);

            let request: Hapi.Request = {
                params: {
                    id: mockBlock.id
                },
                query: {
                    transform: false
                }
            };

            let response = <ItemResponse>(await controller.show(request, undefined));

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlock);
        });

        it("should return error if block not found", async () => {
            let request: Hapi.Request = {
                params: {
                    id: mockBlock.id
                },
                query: {
                    transform: false
                }
            };

            await expect( controller.show(request, undefined)).resolves.toThrowError("Block not found");
        });
    });

    describe("transactions", () => {
        it("should return found transactions", async () => {
            BlockRepositoryMocks.setMockBlock(mockBlock);

            let transaction = BuilderFactory.transfer()
                .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
                .amount("10000000")
                .sign(passphrases[0])
                .nonce("1")
                .build();

            TransactionRepositoryMocks.setMockTransactions([transaction]);

            let request: Hapi.Request = {
                params: {
                    id: mockBlock.id
                },
                query: {
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.transactions(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    id: transaction.data.id
                }
            ));
        });

        it("should return error if block not found", async () => {
            let request: Hapi.Request = {
                params: {
                    id: mockBlock.id
                },
                query: {
                    transform: false
                }
            };

            await expect( controller.transactions(request, undefined)).resolves.toThrowError("Block not found");
        });

        it("should return error if block does not have an id", async () => {
            let mockBlockWithoutId = Object.assign({}, mockBlock);
            delete mockBlockWithoutId.id;

            BlockchainMocks.setMockBlock({data: mockBlockWithoutId} as Partial<Interfaces.IBlock>);

            let request: Hapi.Request = {
                params: {
                    id: mockBlock.id
                },
                query: {
                    transform: false
                }
            };

            await expect( controller.transactions(request, undefined)).resolves.toThrowError("Block not found");
        });
    });

    describe("search", () => {
        it("should return found blocks from store", async () => {
            BlockRepositoryMocks.setMockBlocks([mockBlock]);

            let request: Hapi.Request = {
                params: {
                    id: mockBlock.id
                },
                query: {
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.search(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(mockBlock);
        });
    });
});
