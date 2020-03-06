import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Transactions } from "@packages/crypto";
import { Wallets } from "@packages/core-state";
import { BridgechainController } from "@packages/core-magistrate-api/src/controllers/bridgechains";
import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { Assets } from '../__fixtures__'
import {
    IBridgechainRegistrationAsset,
} from "@packages/core-magistrate-crypto/src/interfaces";

let app: Application;
let controller: BridgechainController;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;
let bridgechainRegistrationAsset: IBridgechainRegistrationAsset;

beforeEach(() => {
    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    let businessRegistrationAsset = Assets.businessRegistrationAsset;

    senderWallet = buildSenderWallet(app);

    senderWallet.setAttribute("business.businessAsset", businessRegistrationAsset);

    walletRepository.index(senderWallet);

    bridgechainRegistrationAsset = Assets.bridgechainRegistrationAsset;

    let businessAttributes = senderWallet.getAttribute("business");

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
    } catch {}
});

describe("BridgechainController", () => {
    describe("index", () => {
        it("should return registered bridgechain", async () => {
            let request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                }
            };

            let response = <PaginatedResponse>(await controller.index(request, undefined));

            expect(response.totalCount).toBe(1);
            expect(response.results[0]).toEqual(expect.objectContaining(
                bridgechainRegistrationAsset
            ));
        });
    });

    describe("show", () => {
        it("should return registered bridgechain", async () => {
            let request: Hapi.Request = {
                params: {
                    id: bridgechainRegistrationAsset.genesisHash
                }
            };

            let response = <ItemResponse>(await controller.show(request, undefined));

            expect(response.data).toEqual(expect.objectContaining(
                bridgechainRegistrationAsset
            ));
        });

        it("should return error if registered bridgechain not found", async () => {
            let request: Hapi.Request = {
                params: {
                    id: "invalid-genesis-hash"
                }
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Bridgechain not found");
        });
    });

    describe("search", () => {
        it("should return registered bridgechain", async () => {
            let request: Hapi.Request = {
                payload: {
                    id: bridgechainRegistrationAsset.genesisHash
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
                bridgechainRegistrationAsset
            ));
        });
    });
});
