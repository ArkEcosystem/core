import "jest-extended";

import { Contracts } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";
import { BlocksController } from "@packages/core-api/src/controllers/blocks";
import { Block } from "@packages/core-database/src/models";
import { Application, Container } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Wallets } from "@packages/core-state";
import { Mocks } from "@packages/core-test-framework";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Identities, Interfaces, Transactions, Utils } from "@packages/crypto";
import { BuilderFactory } from "@packages/crypto/src/transactions";

import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";

const jestfn = <T extends (...args: unknown[]) => unknown>(
    implementation?: (...args: Parameters<T>) => ReturnType<T>,
) => {
    return jest.fn(implementation);
};

let app: Application;
let controller: BlocksController;
let walletRepository: Wallets.WalletRepository;

const blockHistoryService = {
    findOneByCriteria: jestfn<Contracts.Shared.BlockHistoryService["findOneByCriteria"]>(),
    listByCriteria: jestfn<Contracts.Shared.BlockHistoryService["listByCriteria"]>(),
    listByCriteriaJoinTransactions: jestfn<Contracts.Shared.BlockHistoryService["listByCriteriaJoinTransactions"]>(),
    findOneByCriteriaJoinTransactions: jestfn<
        Contracts.Shared.BlockHistoryService["findOneByCriteriaJoinTransactions"]
    >(),
};
const transactionHistoryService = {
    listByCriteria: jestfn<Contracts.Shared.TransactionHistoryService["listByCriteria"]>(),
};

beforeEach(() => {
    app = initApp();
    app.bind(Identifiers.BlockHistoryService).toConstantValue(blockHistoryService);
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(transactionHistoryService);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<BlocksController>(BlocksController);

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);
    blockHistoryService.findOneByCriteria.mockReset();
    blockHistoryService.listByCriteria.mockReset();
    transactionHistoryService.listByCriteria.mockReset();
});

afterEach(() => {
    Mocks.TransactionRepository.setTransactions([]);
    Mocks.StateStore.setBlock(undefined);
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
    let mockBlockJson;
    let mockBlockTransformed;

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

        mockBlockTransformed = {
            confirmations: 0,
            forged: {
                amount: "300",
                fee: "200",
                reward: "100",
                total: "300",
            },
            generator: {
                address: "DBYyh2vXcigrJGUHfvmYxVxEqeH7vomw6x",
                publicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
                username: "delegate",
            },
            height: 2,
            id: "17184958558311101492",
            payload: {
                hash: undefined,
                length: undefined,
            },
            previous: undefined,
            signature: undefined,
            timestamp: {
                epoch: 2,
                human: "2017-03-21T13:00:02.000Z",
                unix: 1490101202,
            },
            transactions: undefined,
            version: 2,
        };

        mockBlockJson = {
            ...mockBlock,
            reward: mockBlock.reward.toFixed(),
            totalFee: mockBlock.totalFee.toFixed(),
            totalAmount: mockBlock.totalAmount.toFixed(),
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
        it("should return last blocks from store", async () => {
            blockHistoryService.listByCriteria.mockResolvedValue({
                results: [mockBlock as any],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            });

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
            expect(response.results[0]).toEqual(mockBlockJson);
        });

        it("should return last block from store - transformed", async () => {
            blockHistoryService.listByCriteriaJoinTransactions.mockResolvedValue({
                results: [{ data: mockBlock, transactions: [] } as any],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            });

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
            expect(response.results[0]).toEqual({
                id: mockBlock.id,
                version: mockBlock.version,
                height: mockBlock.height,
                previous: mockBlock["previous"],
                forged: {
                    reward: "100",
                    fee: "200",
                    amount: "300",
                    total: "300",
                },
                payload: {
                    hash: mockBlock.payloadHash,
                    length: mockBlock.payloadLength,
                },
                generator: {
                    username: "delegate",
                    address: Identities.Address.fromPassphrase(passphrases[0]),
                    publicKey: Identities.PublicKey.fromPassphrase(passphrases[0]),
                },
                signature: mockBlock.blockSignature,
                confirmations: 0,
                transactions: mockBlock.numberOfTransactions,
                timestamp: {
                    epoch: 2,
                    human: "2017-03-21T13:00:02.000Z",
                    unix: 1490101202,
                },
            });
        });
    });

    describe("first", () => {
        it("should return first block from store", async () => {
            Mocks.StateStore.setBlock({ data: mockBlock } as Partial<Interfaces.IBlock>);

            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.first(request, undefined)) as ItemResponse;

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlockJson);
        });

        it("should return first block from store using transform option", async () => {
            Mocks.StateStore.setBlock({ data: mockBlock, transactions: [] } as Partial<Interfaces.IBlock>);

            const request: Hapi.Request = {
                query: {
                    transform: true,
                },
            };

            const response = (await controller.first(request, undefined)) as ItemResponse;

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlockTransformed);
        });
    });

    describe("last", () => {
        it("should return last block from store", async () => {
            Mocks.Blockchain.setBlock({ data: mockBlock } as Partial<Interfaces.IBlock>);

            const request: Hapi.Request = {
                query: {
                    transform: false,
                },
            };

            const response = (await controller.last(request, undefined)) as ItemResponse;

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlockJson);
        });

        it("should return last block from store using transform option", async () => {
            Mocks.Blockchain.setBlock({ data: mockBlock, transactions: [] } as Partial<Interfaces.IBlock>);

            const request: Hapi.Request = {
                query: {
                    transform: true,
                },
            };

            const response = (await controller.last(request, undefined)) as ItemResponse;

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlockTransformed);
        });
    });

    describe("show", () => {
        it("should return found block from store", async () => {
            blockHistoryService.findOneByCriteria.mockResolvedValueOnce(mockBlock as any);

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
            expect(response.data).toEqual(mockBlockJson);
        });

        it("should return found block from store and last height is defined", async () => {
            blockHistoryService.findOneByCriteria.mockResolvedValueOnce(mockBlock as any);

            const mockBlockchain = app.get(Container.Identifiers.BlockchainService);
            // @ts-ignore
            mockBlockchain.getLastHeight = jest.fn().mockReturnValue(17184958558311102010);

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
            expect(response.data).toEqual(mockBlockJson);
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

        it("should return found block from store using transform option", async () => {
            blockHistoryService.findOneByCriteriaJoinTransactions.mockResolvedValueOnce({
                data: mockBlock as any,
                transactions: [],
            });

            const request: Hapi.Request = {
                params: {
                    id: mockBlock.id,
                },
                query: {
                    transform: true,
                },
            };

            const response = (await controller.show(request, undefined)) as ItemResponse;

            expect(response.data).toBeDefined();
            expect(response.data).toEqual(mockBlockTransformed);
        });

        it("should return error if block not found using transform option", async () => {
            const request: Hapi.Request = {
                params: {
                    id: mockBlock.id,
                },
                query: {
                    transform: true,
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Block not found");
        });
    });

    describe("transactions", () => {
        it("should return found transactions", async () => {
            const transaction = BuilderFactory.transfer()
                .recipientId(Identities.Address.fromPassphrase(passphrases[1]))
                .amount("10000000")
                .sign(passphrases[0])
                .nonce("1")
                .build();

            blockHistoryService.findOneByCriteria.mockResolvedValueOnce(mockBlock as any);
            transactionHistoryService.listByCriteria.mockResolvedValue({
                results: [transaction.data],
                totalCount: 1,
                meta: { totalCountIsEstimate: false },
            });

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

            Mocks.Blockchain.setBlock({ data: mockBlockWithoutId } as Partial<Interfaces.IBlock>);

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
});
