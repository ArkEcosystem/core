import "../../../utils";

import { app } from "@arkecosystem/core-container";
import { Managers } from "@arkecosystem/crypto";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => await setUp());
afterAll(async () => await tearDown());

describe("API 2.0 - Loader", () => {
    describe("GET /node/status", () => {
        it("should GET the node status", async () => {
            const response = await utils.request("GET", "node/status");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data.synced).toBeBoolean();
            expect(response.data.data.now).toBeNumber();
            expect(response.data.data.blocksCount).toBeNumber();
            expect(response.data.data.timestamp).toBeNumber();
        });
    });

    describe("GET /node/syncing", () => {
        it("should GET the node syncing status", async () => {
            const response = await utils.request("GET", "node/syncing");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data.syncing).toBeBoolean();
            expect(response.data.data.blocks).toBeNumber();
            expect(response.data.data.height).toBeNumber();
            expect(response.data.data.id).toBeString();
        });
    });

    describe("GET /node/configuration", () => {
        it("should GET the node configuration", async () => {
            let response = await utils.request("GET", "node/configuration");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();

            expect(response.data.data.core).toBeObject();
            expect(response.data.data.nethash).toBeString();
            expect(response.data.data.slip44).toBeNumber();
            expect(response.data.data.wif).toBeNumber();
            expect(response.data.data.token).toBeString();
            expect(response.data.data.symbol).toBeString();
            expect(response.data.data.explorer).toBeString();
            expect(response.data.data.version).toBeNumber();

            const dynamicFees = app.resolveOptions("transaction-pool").dynamicFees;
            expect(response.data.data.transactionPool.dynamicFees).toEqual(dynamicFees);

            app.resolveOptions("transaction-pool").dynamicFees.enabled = false;

            response = await utils.request("GET", "node/configuration");
            expect(response.data.data.transactionPool.dynamicFees).toEqual({ enabled: false });

            app.resolveOptions("transaction-pool").dynamicFees.enabled = true;
        });
    });

    describe("GET /node/configuration/crypto", () => {
        it("should GET the node crypto configuration", async () => {
            const response = await utils.request("GET", "node/configuration/crypto");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();
            expect(response.data.data).toEqual(Managers.configManager.getPreset("testnet"));
        });
    });

    describe("GET /node/fees", () => {
        it("should GET the node fees", async () => {
            const response = await utils.request("GET", "node/fees", { days: 14 });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.meta.days).toBe(14);
            expect(response.data.data).toBeObject();
        });
    });
});
