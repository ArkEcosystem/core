import "../../../utils";

import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Enums } from "@arkecosystem/core-magistrate-crypto";
import { IEntityWallet } from "@arkecosystem/core-magistrate-transactions/src/interfaces";
import { MagistrateIndex } from "@arkecosystem/core-magistrate-transactions/src/wallet-manager";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const entityRegistrationAsset: IEntityWallet = {
    type: Enums.EntityType.Plugin,
    subType: 0,
    data: {
        name: "iam_a_plugin",
        ipfsData: "Qdm2345ousd462",
    },
};
const registrationTxId = "e77a1d1d080adce114dd27e1cb0a242ec8600fb72cd62eca4e46148bee1d3acc";
let expectedApiEntity;

const walletPublicKey = "0377f81a18d25d77b100cb17e829a72259f08334d064f6c887298917a04df8f647";
let wallet: State.IWallet;

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

describe("API 2.0 - Entities", () => {
    let walletManager: State.IWalletManager;

    beforeEach(() => {
        walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;
        walletManager.reset();

        wallet = walletManager.findByPublicKey(walletPublicKey);
        wallet.setAttribute("entities", {
            [registrationTxId]: entityRegistrationAsset,
        });

        expectedApiEntity = {
            id: registrationTxId,
            address: wallet.address,
            publicKey: walletPublicKey,
            ...entityRegistrationAsset,
            isResigned: false,
        };

        walletManager.reindex(wallet);
    });

    describe("GET /entities", () => {
        it("should GET all entities", async () => {
            const response = await utils.request("GET", `entities`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            expect(response.data.meta.totalCount).toBe(1);
            expect(response.data.data[0]).toEqual(expectedApiEntity);
        });

        it("should GET all entities - when entity is resigned", async () => {
            wallet = walletManager.findByPublicKey(walletPublicKey);
            wallet.setAttribute("entities", {
                [registrationTxId]: { ...entityRegistrationAsset, resigned: true },
            });
            walletManager.reindex(wallet);

            const response = await utils.request("GET", `entities`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toHaveLength(1);

            expect(response.data.meta.totalCount).toBe(1);
            expect(response.data.data[0]).toEqual({ ...expectedApiEntity, isResigned: true });
        });

        it("should give correct meta data", async () => {
            const response = await utils.request("GET", "entities");
            expect(response).toBeSuccessfulResponse();

            const expectedMeta = {
                count: 1,
                first: "/entities?page=1&limit=100",
                last: "/entities?page=1&limit=100",
                next: null,
                pageCount: 1,
                previous: null,
                self: "/entities?page=1&limit=100",
                totalCount: 1,
            };
            expect(response.data.meta).toEqual(expectedMeta);
        });
    });

    describe("GET /entities/:id", () => {
        it("should return wallet with registered entity", async () => {
            const response = await utils.request("GET", `entities/${registrationTxId}`);
            expect(response).toBeSuccessfulResponse();

            expect(response.data.data).toEqual(expectedApiEntity);
        });

        it("should return wallet with registered entity - when entity is resigned", async () => {
            wallet = walletManager.findByPublicKey(walletPublicKey);
            wallet.setAttribute("entities", {
                [registrationTxId]: { ...entityRegistrationAsset, resigned: true },
            });
            walletManager.reindex(wallet);

            const response = await utils.request("GET", `entities/${registrationTxId}`);
            expect(response).toBeSuccessfulResponse();

            expect(response.data.data).toEqual({ ...expectedApiEntity, isResigned: true });
        });

        it("should return error if entity not found", async () => {
            wallet.forgetAttribute("entities");

            utils.expectError(await utils.request("GET", `entities/${registrationTxId}`), 404);
        });

        it("should return error if entity is not found", async () => {
            walletManager.forgetByIndex(MagistrateIndex.Entities, registrationTxId);

            utils.expectError(await utils.request("GET", `entities/${registrationTxId}`), 404);
        });

        it("should return error if wallet has not indexed entity attribute", async () => {
            walletManager.reset();

            wallet = walletManager.findByPublicKey(walletPublicKey);

            walletManager.reindex(wallet);

            wallet.setAttribute("entities", {
                [registrationTxId]: entityRegistrationAsset,
            });

            utils.expectError(await utils.request("GET", `entities/${registrationTxId}`), 404);
        });
    });

    describe("POST /entities/search", () => {
        it("should return wallets", async () => {
            const response = await utils.request("POST", "entities/search", {
                publicKey: walletPublicKey,
            });

            expect(response.data.data).toBeArrayOfSize(1);
            expect(response.data.data[0]).toEqual(expectedApiEntity);
        });
    });
});
