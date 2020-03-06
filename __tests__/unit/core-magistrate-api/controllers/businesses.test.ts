import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-indexes";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { Transactions } from "@arkecosystem/crypto";
import { Wallets } from "@arkecosystem/core-state";
import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { BusinessController } from "@arkecosystem/core-magistrate-api/src/controllers/businesses";
import {
    IBridgechainRegistrationAsset,
} from "@arkecosystem/core-magistrate-crypto/src/interfaces";
import { Assets } from '../__fixtures__'

let app: Application;
let controller: BusinessController;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

beforeEach(() => {
    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    let businessRegistrationAsset = Assets.businessRegistrationAsset;

    senderWallet = buildSenderWallet(app);

    senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

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
            let request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                }
            };

            let response = <PaginatedResponse>(await controller.index(request, undefined));

            expect(response.totalCount).toBe(1);
            expect(response.results.includes(senderWallet)).toBeTrue();
        });
    });

    describe("show", () => {
        it("should return wallet with registered business", async () => {
            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey
                }
            };

            let response = <ItemResponse>(await controller.show(request, undefined));

            expect(response.data).toEqual(senderWallet);
        });

        it("should return error if business not fund", async () => {
            senderWallet.forgetAttribute("business");

            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey
                }
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Business not found");
        });

        it("should return error if wallet do not have public key", async () => {
            delete senderWallet.publicKey;

            let request: Hapi.Request = {
                params: {
                    id: senderWallet.address
                }
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Wallet missing public key property");
        });

        it("should return error if business is not found", async () => {
            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey
                }
            };

            walletRepository.forgetByIndex(MagistrateIndex.Businesses, senderWallet.publicKey!);

            await expect(controller.show(request, undefined)).resolves.toThrowError("Business not found");
        });
    });

    describe("bridgechains", () => {
        let bridgechainRegistrationAsset: IBridgechainRegistrationAsset;

        beforeEach(() => {
            bridgechainRegistrationAsset = Assets.bridgechainRegistrationAsset;

            let businessAttributes = senderWallet.getAttribute("business");

            businessAttributes.bridgechains = {};

            businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
                bridgechainAsset: bridgechainRegistrationAsset,
            };

            walletRepository.index(senderWallet);
        });

        it("should return wallet bridgechains", async () => {
            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey
                },
                query: {
                    page: 1,
                    limit: 100,
                }
            };

            let response = <PaginatedResponse>(await controller.bridgechains(request, undefined));

            expect(response.totalCount).toBe(1);
            expect(response.results[0]).toBeObject();
            expect(response.results[0]).toEqual(expect.objectContaining(
                bridgechainRegistrationAsset
            ));
        });

        it("should return error if wallet does not have registered business", async () => {
            senderWallet.forgetAttribute("business");

            let request: Hapi.Request = {
                params: {
                    id: senderWallet.publicKey
                },
                query: {
                    page: 1,
                    limit: 100,
                }
            };

            await expect(controller.bridgechains(request, undefined)).resolves.toThrowError("Business not found");
        });

        it("should return error if wallet is not found", async () => {
            let request: Hapi.Request = {
                params: {
                    id: "invalid key"
                },
                query: {
                    page: 1,
                    limit: 100,
                }
            };

            await expect(controller.bridgechains(request, undefined)).resolves.toThrowError();
        });
    });

    describe("search", () => {
        it("should return wallets", async () => {
            let request: Hapi.Request = {
                payload: {
                    id: senderWallet.publicKey
                },
                query: {
                    page: 1,
                    limit: 100,
                }
            };

            let response = <PaginatedResponse>(await controller.search(request, undefined));

            expect(response.totalCount).toBe(1);
            expect(response.results[0]).toBeObject();
            expect(response.results[0]).toEqual(expect.objectContaining(
                senderWallet
            ));
        });
    });
});
