import "jest-extended";

import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { sendRequest } from "./__support__/request";
import { setUp, tearDown } from "./__support__/setup";

const axiosMock = new MockAdapter(axios);

jest.mock("is-reachable", () => jest.fn(async peer => true));

let peerMock;

beforeAll(async () => {
    await setUp();

    peerMock = new Peer("1.0.0.99", 4002);
    Object.assign(peerMock, peerMock.headers, { status: "OK" });

    const monitor = app.resolvePlugin("p2p");
    monitor.peers = {};
    monitor.peers[peerMock.ip] = peerMock;
});

afterAll(async () => {
    await tearDown();
});

beforeEach(async () => {
    axiosMock.onPost(/.*:8080.*/).passThrough();
});

afterEach(async () => {
    axiosMock.reset(); // important: resets any existing mocking behavior
});

describe("Blocks", () => {
    describe("POST blocks.latest", () => {
        it("should get the latest block", async () => {
            axiosMock.onGet(/.*\/api\/blocks/).reply(() => [200, { data: [{ id: "123" }] }, peerMock.headers]);

            const response = await sendRequest("blocks.latest");

            expect(response.data.result.id).toBeString();
        });

        it("should not find the latest block", async () => {
            axiosMock.onGet(/.*\/api\/blocks/).reply(() => [404, null, peerMock.headers]);

            const response = await sendRequest("blocks.latest");

            expect(response.data.error.message).toBe("Latest block could not be found.");
        });
    });

    describe("POST blocks.info", () => {
        it("should get the block information", async () => {
            axiosMock.onGet(/.*\/api\/blocks\/123/).reply(() => [200, { data: { id: "123" } }, peerMock.headers]);

            const response = await sendRequest("blocks.info", {
                id: "123",
            });

            expect(response.data.result.id).toBe("123");
        });

        it("should fail to get the block information", async () => {
            const response = await sendRequest("blocks.info", { id: "123" });

            expect(response.data.error.code).toBe(404);
            expect(response.data.error.message).toBe("Block 123 could not be found.");
        });
    });

    describe("POST blocks.transactions", () => {
        it("should get the block transactions", async () => {
            axiosMock
                .onGet(/.*\/api\/blocks\/123\/transactions/)
                .reply(() => [
                    200,
                    { meta: { totalCount: 1 }, data: [{ id: "123" }, { id: "123" }] },
                    peerMock.headers,
                ]);

            const response = await sendRequest("blocks.transactions", {
                id: "123",
            });

            expect(response.data.result.data).toHaveLength(2);
        });

        it("should fail to get the block transactions", async () => {
            const response = await sendRequest("blocks.transactions", { id: "123" });

            expect(response.data.error.code).toBe(404);
            expect(response.data.error.message).toBe("Block 123 could not be found.");
        });
    });
});
