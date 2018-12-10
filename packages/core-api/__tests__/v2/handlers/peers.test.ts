import "@arkecosystem/core-test-utils";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("API 2.0 - Peers", () => {
    let peer;

    describe("GET /peers", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (header, request) => {
                it("should GET all the peers", async () => {
                    const response = await utils[request]("GET", "peers");
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();
                    expect(response.data.data[0]).toBeObject();

                    peer = response.data.data[0];
                });
            },
        );
    });

    describe("GET /peers/:ip", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (_, request) => {
                it("should GET a peer by the given ip", async () => {
                    const response = await utils[request]("GET", `peers/${peer.ip}`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();
                });
            },
        );
    });
});
