import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { BridgechainController } from "@packages/core-magistrate-api/src/controllers/bridgechains";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { IBridgechainRegistrationAsset } from "@packages/core-magistrate-crypto/src/interfaces";
import { Wallets } from "@packages/core-state";
import { Transactions } from "@packages/crypto";

import { Assets } from "../__fixtures__";
import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";

let app: Application;
let controller: BridgechainController;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;
let bridgechainRegistrationAsset: IBridgechainRegistrationAsset;

beforeEach(() => {
    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    const businessRegistrationAsset = Assets.businessRegistrationAsset;

    senderWallet = buildSenderWallet(app);

    senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

    walletRepository.index(senderWallet);

    bridgechainRegistrationAsset = Assets.bridgechainRegistrationAsset;

    const businessAttributes = senderWallet.getAttribute("business");

    businessAttributes.bridgechains = {};

    businessAttributes.bridgechains[bridgechainRegistrationAsset.genesisHash] = {
        bridgechainAsset: bridgechainRegistrationAsset,
    };

    walletRepository.index(senderWallet);

    controller = app.resolve<BridgechainController>(BridgechainController);
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BridgechainRegistrationTransaction,
        );
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.EntityTransaction,
        );
    } catch {}
});

describe("BridgechainController", () => {
    describe("index", () => {
        it("should return registered bridgechain", async () => {
            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBe(1);
            expect(response.results[0]).toEqual(expect.objectContaining(bridgechainRegistrationAsset));
        });
    });

    describe("show", () => {
        it("should return registered bridgechain", async () => {
            const request: Hapi.Request = {
                params: {
                    id: bridgechainRegistrationAsset.genesisHash,
                },
            };

            const response = (await controller.show(request, undefined)) as ItemResponse;

            expect(response.data).toEqual(expect.objectContaining(bridgechainRegistrationAsset));
        });

        it("should return error if registered bridgechain not found", async () => {
            const request: Hapi.Request = {
                params: {
                    id: "invalid-genesis-hash",
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Bridgechain not found");
        });
    });

    describe("search", () => {
        it("should return registered bridgechain", async () => {
            const request: Hapi.Request = {
                payload: {
                    id: bridgechainRegistrationAsset.genesisHash,
                },
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            const response = (await controller.search(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBe(1);
            expect(response.results[0]).toBeObject();
            expect(response.results[0]).toEqual(expect.objectContaining(bridgechainRegistrationAsset));
        });
    });
});
