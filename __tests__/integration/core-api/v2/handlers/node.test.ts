import "../../../../utils";

import { app } from "@arkecosystem/core-container";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("API 2.0 - Loader", () => {
    describe("GET /node/status", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET the node status", async () => {
                    const response = await utils[request]("GET", "node/status");
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();

                    expect(response.data.data.synced).toBeBoolean();
                    expect(response.data.data.now).toBeNumber();
                    expect(response.data.data.blocksCount).toBeNumber();
                });
            },
        );
    });

    describe("GET /node/syncing", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET the node syncing status", async () => {
                    const response = await utils[request]("GET", "node/syncing");
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();

                    expect(response.data.data.syncing).toBeBoolean();
                    expect(response.data.data.blocks).toBeNumber();
                    expect(response.data.data.height).toBeNumber();
                    expect(response.data.data.id).toBeString();
                });
            },
        );
    });

    describe("GET /node/configuration", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET the node configuration", async () => {
                    let response = await utils[request]("GET", "node/configuration");
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();

                    expect(response.data.data.nethash).toBeString();
                    expect(response.data.data.token).toBeString();
                    expect(response.data.data.symbol).toBeString();
                    expect(response.data.data.explorer).toBeString();
                    expect(response.data.data.version).toBeNumber();

                    const dynamicFees = app.resolveOptions("transactionPool").dynamicFees;
                    expect(response.data.data.transactionPool.dynamicFees).toEqual(dynamicFees);

                    app.resolveOptions("transactionPool").dynamicFees.enabled = false;

                    response = await utils[request]("GET", "node/configuration");
                    expect(response.data.data.transactionPool.dynamicFees).toEqual({ enabled: false });

                    app.resolveOptions("transactionPool").dynamicFees.enabled = true;
                });
            },
        );
    });
});
