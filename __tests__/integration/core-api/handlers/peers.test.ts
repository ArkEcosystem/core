import "@packages/core-test-framework/src/matchers";

import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { ApiHelpers } from "@packages/core-test-framework/src";

import { setUp, tearDown } from "../__support__/setup";

const peers = [
    {
        ip: "1.0.0.99",
        port: 4002,
        version: "3.0.0-next.1",
        state: {
            height: 2,
        },
        latency: 2,
    },
    {
        ip: "1.0.0.98",
        port: 4002,
        version: "3.0.0-next.0",
        state: {
            height: 1,
        },
        latency: 1,
    },
];

let app: Contracts.Kernel.Application;
let api: ApiHelpers;

beforeAll(async () => {
    app = await setUp();
    api = new ApiHelpers(app);

    const peerMocks = peers.map((mock) => {
        const peerMock = new Peer(mock.ip, mock.port);
        peerMock.version = mock.version;
        peerMock.latency = mock.latency;
        peerMock.state.height = mock.state.height;

        return peerMock;
    });

    for (const peerMock of Object.values(peerMocks)) {
        // @ts-ignore
        app.get<Contracts.P2P.PeerRepository>(Container.Identifiers.PeerRepository).setPeer(peerMock);
    }
});

afterAll(async () => await tearDown());

describe("API 2.0 - Peers", () => {
    describe("GET /peers", () => {
        it("should GET all the peers", async () => {
            const response = await api.request("GET", "peers");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data[0]).toBeObject();
        });

        it("should GET all the peers sorted by version,asc", async () => {
            const response = await api.request("GET", "peers", { orderBy: "version:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[1].ip);
            expect(response.data.data[1].ip).toBe(peers[0].ip);
        });

        it("should GET all the peers sorted by version,desc", async () => {
            const response = await api.request("GET", "peers", { orderBy: "version:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[0].ip);
            expect(response.data.data[1].ip).toBe(peers[1].ip);
        });

        it("should GET all the peers sorted by height,asc", async () => {
            const response = await api.request("GET", "peers", { orderBy: "height:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[1].ip);
            expect(response.data.data[1].ip).toBe(peers[0].ip);
        });

        it("should GET all the peers sorted by height,desc", async () => {
            const response = await api.request("GET", "peers", { orderBy: "height:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[0].ip);
            expect(response.data.data[1].ip).toBe(peers[1].ip);
        });

        it("should GET all the peers sorted by latency,asc", async () => {
            const response = await api.request("GET", "peers", { orderBy: "latency:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[1].ip);
            expect(response.data.data[1].ip).toBe(peers[0].ip);
        });

        it("should GET all the peers sorted by latency,desc", async () => {
            const response = await api.request("GET", "peers", { orderBy: "latency:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[0].ip);
            expect(response.data.data[1].ip).toBe(peers[1].ip);
        });
    });

    describe("GET /peers/:ip", () => {
        it("should GET a peer by the given ip", async () => {
            const response = await api.request("GET", `peers/${peers[0].ip}`);
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeObject();
            expect(response.data.data.ip).toBe(peers[0].ip);
            expect(response.data.data.port).toBe(peers[0].port);
        });

        it("should fail to GET a peer by the given ip if it doesn't exist", async () => {
            api.expectError(await api.request("GET", "peers/127.0.0.1"), 404);
        });
    });
});
