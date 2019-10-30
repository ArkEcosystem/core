import "@packages/core-test-framework/src/matchers";

import { app, Contracts, Container } from "@arkecosystem/core-kernel";
import { Peer } from "@arkecosystem/core-p2p/src/peer";

import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const peers = [
    {
        ip: "1.2.3.4",
        port: 4000,
        version: "3.0.0-next.1",
        latency: 1,
    },
    {
        ip: "5.6.7.8",
        port: 4000,
        version: "3.0.0-next.0",
        latency: 2,
    },
];

beforeAll(async () => {
    await setUp();

    const peerMocks = peers.map(mock => {
        const peerMock = new Peer(mock.ip);
        peerMock.port = mock.port;
        peerMock.version = mock.version;
        peerMock.latency = mock.latency;

        return peerMock;
    });

    for (const peerMock of Object.values(peerMocks)) {
        // @ts-ignore
        app.get<Contracts.P2P.PeerStorage>(Container.Identifiers.PeerStorage).setPeer(peerMock);
    }
});

afterAll(tearDown);

describe("API 2.0 - Peers", () => {
    describe("GET /peers", () => {
        it("should GET all the peers", async () => {
            const response = await utils.request("GET", "peers");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data[0]).toBeObject();
        });

        it("should GET all the peers sorted by version,asc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "version:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[1].ip);
            expect(response.data.data[1].ip).toBe(peers[0].ip);
        });

        it("should GET all the peers sorted by version,desc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "version:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[0].ip);
            expect(response.data.data[1].ip).toBe(peers[1].ip);
        });
    });

    describe("GET /peers/:ip", () => {
        it("should GET a peer by the given ip", async () => {
            const response = await utils.request("GET", `peers/${peers[0].ip}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();
            expect(response.data.data.ip).toBe(peers[0].ip);
            expect(response.data.data.port).toBe(peers[0].port);
        });

        it("should fail to GET a peer by the given ip if it doesn't exist", async () => {
            utils.expectError(await utils.request("GET", "peers/127.0.0.1"), 404);
        });
    });
});
