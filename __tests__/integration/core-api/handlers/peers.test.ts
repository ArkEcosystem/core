import "../../../utils";

import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { createStubPeer } from "../../../helpers/peers";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const peers = [
    {
        ip: "1.0.0.99",
        port: 4001,
        version: "2.4.0-next.3",
        state: {
            height: 2,
        },
        latency: 2,
    },
    {
        ip: "1.0.0.98",
        port: 4000,
        version: "2.4.0-next.1",
        state: {
            height: 1,
        },
        latency: 1,
    },
];

beforeAll(async () => {
    await setUp();

    const peerMocks = peers
        .map(mock => createStubPeer({ ...mock }))
        .reduce((result, mock) => ({ ...result, [mock.ip]: mock }), {});

    for (const peerMock of Object.values(peerMocks)) {
        app.resolvePlugin("p2p")
            .getStorage()
            .setPeer(peerMock);
    }
});

afterAll(async () => await tearDown());

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

        it("should GET all the peers sorted by height,asc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "height:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[1].ip);
            expect(response.data.data[1].ip).toBe(peers[0].ip);
        });

        it("should GET all the peers sorted by height,desc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "height:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[0].ip);
            expect(response.data.data[1].ip).toBe(peers[1].ip);
        });

        it("should GET all the peers sorted by latency,asc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "latency:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[1].ip);
            expect(response.data.data[1].ip).toBe(peers[0].ip);
        });

        it("should GET all the peers sorted by latency,desc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "latency:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[0].ip);
            expect(response.data.data[1].ip).toBe(peers[1].ip);
        });

        it("should GET all the peers sorted by port,asc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "port:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[1].ip);
            expect(response.data.data[1].ip).toBe(peers[0].ip);
        });

        it("should GET all the peers sorted by port,desc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "port:desc" });
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
