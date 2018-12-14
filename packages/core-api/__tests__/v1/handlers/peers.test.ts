import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import "@arkecosystem/core-test-utils";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

const mockAddress = "1.0.0.99";
const mockPort = 4002;

beforeAll(async () => {
    await setUp();

    const peerMock = new Peer(mockAddress, mockPort);
    peerMock.setStatus("OK");

    const monitor = app.resolvePlugin("p2p");
    monitor.peers = {};
    monitor.peers[peerMock.ip] = peerMock;
});

afterAll(async () => {
    const monitor = app.resolvePlugin("p2p");
    monitor.peers = {};

    await tearDown();
});

describe("API 1.0 - Peers", () => {
    describe("GET /peers", () => {
        it("should pass using valid parameters", async () => {
            const response = await utils.request("GET", "peers", { limit: 50 });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.error).toBeUndefined();
        });

        it("should fail using limit > 100", async () => {
            const response = await utils.request("GET", "peers", { limit: 101 });
            utils.expectError(response);
        });

        it("should fail using invalid parameters", async () => {
            const response = await utils.request("GET", "peers", {
                state: "invalid",
                os: "invalid",
                shared: "invalid",
                version: "invalid",
                limit: "invalid",
                offset: "invalid",
                orderBy: "invalid",
            });
            utils.expectError(response);

            expect(response.data.error).not.toBeNull();
        });
    });

    describe("GET /peers/get", () => {
        it("should pass using valid data", async () => {
            const response = await utils.request("GET", "peers/get", {
                ip: mockAddress,
                port: mockPort,
            });
            expect(response).toBeSuccessfulResponse();
            expect(response.data).toBeObject();
            expect(response.data.peer.ip).toBe(mockAddress);
            expect(response.data.peer.port).toBe(mockPort);
        });

        it("should fail using known ip address with no port", async () => {
            const response = await utils.request("GET", "peers/get", {
                ip: "127.0.0.1",
            });
            utils.expectError(response);

            expect(response.data.error).toBe("should have required property 'port'");
        });

        it("should fail using valid port with no ip address", async () => {
            const response = await utils.request("GET", "peers/get", { port: 4002 });
            utils.expectError(response);

            expect(response.data.error).toBe("should have required property 'ip'");
        });

        it("should fail using unknown ip address and port", async () => {
            const response = await utils.request("GET", "peers/get", {
                ip: "99.99.99.99",
                port: mockPort,
            });
            utils.expectError(response);

            expect(response.data.error).toBe(`Peer 99.99.99.99:${mockPort} not found`);
        });
    });

    describe("GET /peers/version", () => {
        it("should be ok", async () => {
            const response = await utils.request("GET", "peers/version");
            expect(response).toBeSuccessfulResponse();

            expect(response.data.version).toBeString();
        });
    });
});
