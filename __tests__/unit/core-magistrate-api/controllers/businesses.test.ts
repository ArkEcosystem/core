import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { BusinessController } from "@packages/core-magistrate-api/src/controllers/businesses";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { IBridgechainRegistrationAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import { MagistrateIndex } from "@packages/core-magistrate-transactions/src/wallet-indexes";
import { Wallets } from "@packages/core-state";
import { Transactions } from "@packages/crypto";

import { Assets } from "../__fixtures__";
import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";

let app: Application;
let controller: BusinessController;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

beforeEach(() => {
    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    senderWallet = buildSenderWallet(app);

    senderWallet.setAttribute("business.businessAsset", Assets.businessRegistrationAsset);

    walletRepository.index(senderWallet);

    controller = app.resolve<BusinessController>(BusinessController);
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

describe("BusinessController", () => {
    describe("index", () => {
        it("should return wallets with registered business", async () => {
            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            const response = <PaginatedResponse>await controller.index(request, undefined);

            expect(response.totalCount).toBe(1);
            expect(response.results.includes(senderWallet)).toBeTrue();
        });
    });

    describe("show", () => {
        it("should return wallet with registered business", async () => {
            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
            };

            const response = <ItemResponse>await controller.show(request, undefined);

            expect(response.data).toEqual(senderWallet);
        });

        it("should return error if business not fund", async () => {
            senderWallet.forgetAttribute("business");

            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Business not found");
        });

        it("should return error if wallet do not have public key", async () => {
            delete senderWallet.publicKey;

            const request: Hapi.Request = {
                params: {
                    id: senderWallet.address,
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError(
                "Wallet missing public key property",
            );
        });

        it("should return error if business is not found", async () => {
            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
            };

            walletRepository.forgetByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!);

            await expect(controller.show(request, undefined)).resolves.toThrowError("Business not found");
        });

        it("should return error if wallet has not indexed business attribute", async () => {
            walletRepository.forgetByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!);

            senderWallet = buildSenderWallet(app);

            walletRepository.index(senderWallet);

            senderWallet.setAttribute("business.businessAsset", Assets.businessRegistrationAsset);

            const request: Hapi.Request = {
                params: {
                    id: senderWallet.address,
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError(
                "Business not found",
            );
        });
    });

    describe("bridgechains", () => {
        let bridgechainRegistrationAsset: IBridgechainRegistrationAsset;

        beforeEach(() => {
            bridgechainRegistrationAsset = Assets.bridgechainRegistrationAsset;

            const businessAttributes = senderWallet.getAttribute("business");

            businessAttributes.bridgechains = {};

            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
                bridgechainAsset: bridgechainRegistrationAsset,
            };

            walletRepository.index(senderWallet);
        });

        it("should return wallet bridgechains", async () => {
            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            const response = <PaginatedResponse>await controller.bridgechains(request, undefined);

            expect(response.totalCount).toBe(1);
            expect(response.results[0]).toBeObject();
            expect(response.results[0]).toEqual(expect.objectContaining(bridgechainRegistrationAsset));
        });

        it("should return error if wallet does not have registered business", async () => {
            senderWallet.forgetAttribute("business");

            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            await expect(controller.bridgechains(request, undefined)).resolves.toThrowError("Business not found");
        });

        it("should return error if wallet is not found", async () => {
            const request: Hapi.Request = {
                params: {
                    id: "invalid key",
                },
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            await expect(controller.bridgechains(request, undefined)).resolves.toThrowError();
        });

        it("should return boom if error is thrown", async () => {
            const request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            // @ts-ignore
            controller.toPagination = () => {
                throw new Error()
            };

            await expect(controller.bridgechains(request, undefined)).resolves.toThrowError();
        });
    });

    describe("search", () => {
        it("should return wallets", async () => {
            const request: Hapi.Request = {
                payload: {
                    id: senderWallet.publicKey,
                },
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            const response = <PaginatedResponse>await controller.search(request, undefined);

            expect(response.totalCount).toBe(1);
            expect(response.results[0]).toBeObject();
            expect(response.results[0]).toEqual(expect.objectContaining(senderWallet));
        });
    });
});
