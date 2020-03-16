import "jest-extended";

import Hapi from "@hapi/hapi";

import { Application, Contracts } from "@packages/core-kernel";
import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { DelegatesController } from "@packages/core-api/src/controllers/delegates";
import { BlockRepositoryMocks } from "../mocks";
import { Wallets } from "@packages/core-state";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Identities, Transactions, Utils } from "@packages/crypto";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import passphrases from "@packages/core-test-framework/src/internal/passphrases.json";
import { Block } from "@packages/core-database/src/models";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";

let app: Application;
let controller: DelegatesController;
let walletRepository: Wallets.WalletRepository;

beforeEach(() => {
    app = initApp();

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<DelegatesController>(DelegatesController);
    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);
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

describe("DelegatesController", () => {
    let delegateWallet: Contracts.State.Wallet;
    let delegateAttributes: any;

    beforeEach(() => {
        delegateWallet = buildSenderWallet(app);

        delegateAttributes = {
            username: "delegate",
            voteBalance: Utils.BigNumber.make("200"),
            rank: 1,
            resigned: false,
            producedBlocks: 0,
            forgedFees: Utils.BigNumber.make("2"),
            forgedRewards: Utils.BigNumber.make("200"),
            lastBlock: {
                id: "123",
                height: 2,
                timestamp: 2,
            }
        };

        delegateWallet.setAttribute("delegate", delegateAttributes);

        walletRepository.index(delegateWallet);
    });

    describe("index", () => {
        it("should return list of delegates", async () => {
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
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    username: delegateAttributes.username
                }
            ));
        });
    });

    describe("show", () => {
        it("should return delegate", async () => {
            let request: Hapi.Request = {
                params: {
                    id: delegateWallet.publicKey
                }
            };

            let response = <ItemResponse>(await controller.show(request, undefined));

            expect(response.data).toEqual(expect.objectContaining(
                {
                    username: delegateAttributes.username
                }
            ));
        });

        it("should return error if delegate does not exist", async () => {
            let request: Hapi.Request = {
                params: {
                    id: Identities.PublicKey.fromPassphrase(passphrases[1])
                }
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Delegate not found");
        });

        it("should return error if delegate does not have username", async () => {
            let request: Hapi.Request = {
                params: {
                    id: delegateWallet.publicKey
                }
            };

            delegateWallet.forgetAttribute("delegate.username");

            await expect(controller.show(request, undefined)).resolves.toThrowError("Delegate not found");
        });
    });

    describe("search", () => {
        it("should return list of delegates", async () => {
            let request: Hapi.Request = {
                params: {
                    id: delegateWallet.publicKey
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.search(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    username: delegateAttributes.username
                }
            ));
        });
    });

    describe("blocks", () => {
        it("should return list of delegates", async () => {
            let mockBlock: Partial<Block> = {
                id: "17184958558311101492",
                reward: Utils.BigNumber.make("100"),
                totalFee: Utils.BigNumber.make("200"),
                totalAmount: Utils.BigNumber.make("300"),
            };

            BlockRepositoryMocks.setMockBlocks([mockBlock]);

            let request: Hapi.Request = {
                params: {
                    id: delegateWallet.publicKey
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.blocks(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    id: mockBlock.id
                }
            ));
        });

        it("should return error if delegate does not exists", async () => {
            let request: Hapi.Request = {
                params: {
                    id: Identities.PublicKey.fromPassphrase(passphrases[1])
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            await expect(controller.blocks(request, undefined)).resolves.toThrowError("Delegate not found");
        });
    });

    describe("voters", () => {
        it("should return list of voting wallets", async () => {
            let voteWallet = buildSenderWallet(app, passphrases[1]);

            voteWallet.setAttribute("vote", delegateWallet.publicKey);

            walletRepository.index(voteWallet);

            let request: Hapi.Request = {
                params: {
                    id: delegateWallet.publicKey
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            let response = <PaginatedResponse>(await controller.voters(request, undefined));

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(expect.objectContaining(
                {
                    address: voteWallet.address,
                    publicKey: voteWallet.publicKey,
                }
            ));
        });

        it("should return error if delegate does not exists", async () => {
            let request: Hapi.Request = {
                params: {
                    id: Identities.PublicKey.fromPassphrase(passphrases[1])
                },
                query: {
                    page: 1,
                    limit: 100,
                    transform: false
                }
            };

            await expect(controller.voters(request, undefined)).resolves.toThrowError("Delegate not found");
        });
    });
});
