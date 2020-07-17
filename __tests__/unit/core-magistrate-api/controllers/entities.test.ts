import "jest-extended";

import Hapi from "@hapi/hapi";
import { Application, Contracts } from "@arkecosystem/core-kernel";
import { Identifiers } from "@arkecosystem/core-kernel/src/ioc";
import { EntityController } from "@arkecosystem/core-magistrate-api/src/controllers/entities";
import { Transactions as MagistrateTransactions } from "@arkecosystem/core-magistrate-crypto";
import { MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-indexes";
import { Wallets } from "@arkecosystem/core-state";
import { Transactions } from "@arkecosystem/crypto";

import { buildSenderWallet, initApp, ItemResponse, PaginatedResponse } from "../__support__";
import { IEntityWallet } from "@arkecosystem/core-magistrate-transactions/src/interfaces";
import { Enums } from "@arkecosystem/core-magistrate-crypto/src";

let app: Application;
let controller: EntityController;
let senderWallet: Contracts.State.Wallet;
let walletRepository: Wallets.WalletRepository;

const entityRegistrationAsset: IEntityWallet = {
    type: Enums.EntityType.Developer,
    subType: Enums.EntitySubType.None,
    data: {
        name: "iam_a_dev",
        ipfsData: "Qdm2345ousd462",
    }
};
const registrationTxId = "e77a1d1d080adce114dd27e1cb0a242ec8600fb72cd62eca4e46148bee1d3acc";
let expectedApiEntity;

beforeEach(() => {
    app = initApp();

    walletRepository = app.get<Wallets.WalletRepository>(Identifiers.WalletRepository);

    senderWallet = buildSenderWallet(app);

    senderWallet.setAttribute("entities", {
        [registrationTxId]: entityRegistrationAsset
    });

    expectedApiEntity = {
        id: registrationTxId,
        address: senderWallet.address,
        publicKey: senderWallet.publicKey,
        ...entityRegistrationAsset,
        isResigned: false,
    };

    walletRepository.index(senderWallet);

    controller = app.resolve<EntityController>(EntityController);
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

describe("EntityController", () => {
    describe("index", () => {
        it("should return wallets with registered entities", async () => {
            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            const response = <PaginatedResponse>await controller.index(request, undefined);

            expect(response.totalCount).toBe(1);
            expect(response.results[0]).toEqual(expectedApiEntity);
        });
    });

    describe("show", () => {
        it("should return wallet with registered entity", async () => {
            const request: Hapi.Request = {
                params: {
                    id: registrationTxId,
                },
            };

            const response = <ItemResponse>await controller.show(request, undefined);

            expect(response.data).toEqual(expectedApiEntity);
        });

        it("should return error if entity not found", async () => {
            senderWallet.forgetAttribute("entities");

            const request: Hapi.Request = {
                params: {
                    id: registrationTxId,
                },
            };
            
            await expect(controller.show(request, undefined)).resolves.toThrowError("Entity not found");
        });

        it("should return error if entity is not found", async () => {
            const request: Hapi.Request = {
                params: {
                    id: registrationTxId,
                },
            };

            walletRepository.forgetByIndex(MagistrateIndex.Entities, registrationTxId);

            await expect(controller.show(request, undefined)).resolves.toThrowError("Entity not found");
        });

        it("should return error if wallet has not indexed entity attribute", async () => {
            walletRepository.forgetByIndex(MagistrateIndex.Entities, registrationTxId);

            senderWallet = buildSenderWallet(app);

            walletRepository.index(senderWallet);

            senderWallet.setAttribute("entities", {
                [registrationTxId]: entityRegistrationAsset
            });

            const request: Hapi.Request = {
                params: {
                    id: registrationTxId,
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Entity not found");
        });
    });

    describe("search", () => {
        it("should return wallets", async () => {
            const request: Hapi.Request = {
                payload: {
                    id: registrationTxId,
                },
                query: {
                    page: 1,
                    limit: 100,
                },
            };

            const response = <PaginatedResponse>await controller.search(request, undefined);

            expect(response.totalCount).toBe(1);
            expect(response.results[0]).toEqual(expectedApiEntity);
        });
    });
});
