import "./mocks/core-container";

import { NetworkState, NetworkStateStatus } from "@arkecosystem/core-p2p";
import { httpie } from "@arkecosystem/core-utils";
import "jest-extended";
import nock from "nock";
import { Client } from "../../../packages/core-forger/src/client";
import { HostNoResponseError } from "../../../packages/core-forger/src/errors";
import { sampleBlocks } from "./__fixtures__/blocks";

jest.setTimeout(30000);

const host = "http://127.0.0.1:4000";

let client: Client;

beforeEach(() => {
    client = new Client(host);

    nock(host)
        .get("/peer/status")
        .reply(200);
});

afterEach(() => {
    nock.cleanAll();
});

describe("Client", () => {
    describe("constructor", () => {
        it("accepts 1 or more hosts as parameter", () => {
            expect(new Client(host).hosts).toEqual([host]);

            const hosts = [host, "http://localhost:4000"];

            expect(new Client(hosts).hosts).toEqual(hosts);
        });
    });

    describe("broadcast", () => {
        describe("when the host is available", () => {
            for (const sampleBlock of sampleBlocks) {
                it("should be truthy if broadcasts", async () => {
                    nock(host)
                        .post("/internal/blocks")
                        .reply(200, (_, requestBody) => {
                            expect(requestBody.block).toMatchObject(
                                expect.objectContaining({
                                    id: sampleBlock.data.id,
                                }),
                            );

                            return requestBody;
                        });

                    await client.selectHost();

                    const wasBroadcasted = await client.broadcast(sampleBlock.toJson());
                    expect(wasBroadcasted).toBeTruthy();
                });
            }
        });
    });

    describe("getRound", () => {
        describe("when the host is available", () => {
            it("should be ok", async () => {
                const expectedResponse = { foo: "bar" };
                nock(host)
                    .get("/internal/rounds/current")
                    .reply(200, { data: expectedResponse });

                const response = await client.getRound();

                expect(response).toEqual(expectedResponse);
            });
        });
    });

    describe("getTransactions", () => {
        describe("when the host is available", () => {
            it("should be ok", async () => {
                const expectedResponse = { foo: "bar" };
                nock(host)
                    .get("/internal/transactions/forging")
                    .reply(200, { data: expectedResponse });

                await client.selectHost();
                const response = await client.getTransactions();

                expect(response).toEqual(expectedResponse);
            });
        });
    });

    describe("getNetworkState", () => {
        describe("when the host is available", () => {
            it("should be ok", async () => {
                const expectedResponse = new NetworkState(NetworkStateStatus.Test);
                nock(host)
                    .get("/internal/network/state")
                    .reply(200, { data: expectedResponse });

                await client.selectHost();
                const response = await client.getNetworkState();

                expect(response).toEqual(expectedResponse);
            });
        });
    });

    describe("syncCheck", () => {
        it("should induce network sync", async () => {
            jest.spyOn(httpie, "get");
            nock(host)
                .get("/internal/blockchain/sync")
                .reply(200);

            await client.selectHost();
            await client.syncCheck();

            expect(httpie.get).toHaveBeenCalledWith(`${host}/internal/blockchain/sync`, expect.any(Object));
        });
    });

    describe("selectHost", () => {
        it("should fallback to responsive host", async () => {
            client = new Client(["http://127.0.0.2:4000", "http://127.0.0.3:4000", host]);
            await expect(client.selectHost()).toResolve();
        });

        it("should throw error when no host is responsive", async () => {
            client = new Client(["http://127.0.0.2:4000", "http://127.0.0.3:4000"]);
            await expect(client.selectHost()).rejects.toThrowError(HostNoResponseError);
        });
    });

    describe("emitEvent", () => {
        it("should emit events", async () => {
            jest.spyOn(httpie, "post");
            nock(host)
                .post("/internal/utils/events")
                .reply(200, (_, requestBody) => {
                    expect(requestBody).toMatchObject({ event: "foo", body: "bar" });
                    return [200];
                });

            await client.selectHost();
            await client.emitEvent("foo", "bar");

            expect(httpie.post).toHaveBeenCalledWith(`${host}/internal/utils/events`, {
                body: JSON.stringify({ event: "foo", body: "bar" }),
                headers: {
                    "Content-Type": "application/json",
                    nethash: {},
                    port: 4000,
                    version: "2.3.0",
                    "x-auth": "forger",
                },
                retry: { retries: 0 },
                timeout: 2000,
            });
        });
    });
});
