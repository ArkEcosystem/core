import "./mocks/core-container";

import "jest-extended";

import delay from "delay";
import { Client } from "../../../packages/core-forger/src/client";
import { sampleBlock } from "./__fixtures__/block";

jest.setTimeout(30000);

let client;

beforeAll(async () => {
    await delay(2000);
    client = new Client({
        port: 4000,
        ip: "127.0.0.1",
    });
});

describe("Client", () => {
    /*describe("constructor", () => {
        it("accepts 1 or more hosts as parameter", () => {
            expect(new Client(host).hosts).toEqual([host]);

            const hosts = [host, "http://localhost:4000"];

            expect(new Client(hosts).hosts).toEqual(hosts);
        });
    });*/

    describe("broadcast", () => {
        describe("when the host is available", () => {
            it("should be truthy if broadcasts", async () => {
                await client.__chooseHost(1000);

                const wasBroadcasted = await client.broadcast(sampleBlock.toJson());
                expect(wasBroadcasted).toBeTruthy();
            });
        });
    });

    describe("getRound", () => {
        describe("when the host is available", () => {
            it("should be ok", async () => {
                const expectedResponse = { foo: "bar" };

                const response = await client.getRound();

                expect(response.lastBlock).toBeObject();
                expect(response.lastBlock.height).toBe(1);
                expect(response.reward).toBe(0);
            });
        });
    });

    describe("getTransactions", () => {
        describe("when the host is available", () => {
            it("should be ok", async () => {
                await client.__chooseHost();
                const response = await client.getTransactions();

                expect(response.transactions).toBeArray();
            });
        });
    });

    describe("getNetworkState", () => {
        describe("when the host is available", () => {
            it("should be ok", async () => {
                await client.__chooseHost();
                const response = await client.getNetworkState();

                expect(response).toBeObject();
                expect(response.nodeHeight).toBe(1);
                expect(response.quorumDetails).toBeObject();
            });
        });
    });

    describe("syncCheck", () => {
        it("should induce network sync", async () => {
            const response = await client.syncCheck();

            expect(response).toBeUndefined();

            // expect(axios.get).toHaveBeenCalledWith(`${host}/internal/blockchain/sync`, expect.any(Object));
        });
    });

    describe("getUsernames", () => {
        it("should fetch usernames", async () => {
            const response = await client.getUsernames();

            expect(response).toEqual({});
        });
    });
    /*
    describe("emitEvent", () => {
        it("should emit events", async () => {
            
            await client.__chooseHost();
            await client.emitEvent("foo", "bar");

            /*expect(axios.post).toHaveBeenCalledWith(
                `${host}/internal/utils/events`,
                { event: "foo", body: "bar" },
                expect.any(Object),
            );*/
    /*   });
    });*/
});
