import "../../../utils";

import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import semver from "semver";
import { setUp, tearDown } from "../__support__/setup";
import { utils } from "../utils";

const peers = [
    {
        ip: "1.0.0.99",
        port: 4002,
        version: "2.4.0-next.3",
        state: {
            height: 2,
        },
        latency: 2,
    },
    {
        ip: "1.0.0.98",
        port: 4002,
        version: "2.4.0-next.1",
        state: {
            height: 1,
        },
        latency: 1,
    },
    {
        ip: "1.0.0.97",
        port: 4002,
        version: "2.5.0",
        state: {
            height: 3,
        },
        latency: 1,
    },
    {
        ip: "1.0.0.96",
        port: 4002,
        version: "2.5.1",
        state: {
            height: 4,
        },
        latency: 2,
    },
    {
        ip: "1.0.0.95",
        port: 4002,
        version: "2.5.2",
        state: {
            height: 4,
        },
        latency: 3,
    },
];

beforeAll(async () => {
    await setUp();

    const peerMocks = JSON.parse(JSON.stringify(peers)).map(mock => {
        const peer = new Peer(mock.ip);
        (peer as any).port = mock.port;

        delete mock.port;

        return Object.assign(peer, mock);
    });

    for (const peerMock of peerMocks) {
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

        it("should give correct meta data", async () => {
            const response = await utils.request("GET", "peers");
            expect(response).toBeSuccessfulResponse();

            const expectedMeta = {
                count: 5,
                first: "/peers?page=1&limit=100",
                last: "/peers?page=1&limit=100",
                next: null,
                pageCount: 1,
                previous: null,
                self: "/peers?page=1&limit=100",
                totalCount: 5,
                totalCountIsEstimate: undefined,
            };
            expect(response.data.meta).toEqual(expectedMeta);
        });

        it("should GET all the peers sorted by version,asc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "version:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();

            expect(response.data.data.sort((a, b) => semver.compare(a.version, b.version))).toEqual(response.data.data);
        });

        it("should GET all the peers sorted by version,desc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "version:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();

            expect(response.data.data.sort((a, b) => semver.rcompare(a.version, b.version))).toEqual(
                response.data.data,
            );
        });

        it("should GET all the peers sorted by height,asc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "height:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();

            expect(response.data.data.sort((a, b) => a.height < b.height)).toEqual(response.data.data);
        });

        it("should GET all the peers sorted by height,desc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "height:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();

            expect(response.data.data.sort((a, b) => a.height > b.height)).toEqual(response.data.data);
        });

        it("should GET all the peers sorted by latency,asc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "latency:asc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();

            expect(response.data.data.sort((a, b) => a.latency < b.latency)).toEqual(response.data.data);
        });

        it("should GET all the peers sorted by latency,desc", async () => {
            const response = await utils.request("GET", "peers", { orderBy: "latency:desc" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(peers.length);
            expect(response.data.data[0]).toBeObject();

            expect(response.data.data.sort((a, b) => a.latency > b.latency)).toEqual(response.data.data);
        });

        it("should GET the peers filtered by exact version", async () => {
            const response = await utils.request("GET", "peers", { version: "2.5.0" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(1);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[2].ip);
        });

        it("should GET the peers filtered by version including wildcard", async () => {
            const response = await utils.request("GET", "peers", { version: "2.5.*" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(3);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[2].ip);
            expect(response.data.data[1].ip).toBe(peers[3].ip);
            expect(response.data.data[2].ip).toBe(peers[4].ip);
        });

        it("should GET the peers filtered by version range", async () => {
            const response = await utils.request("GET", "peers", { version: "2.5.1 - 2.5.2" });
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArrayOfSize(2);
            expect(response.data.data[0]).toBeObject();
            expect(response.data.data[0].ip).toBe(peers[3].ip);
            expect(response.data.data[1].ip).toBe(peers[4].ip);
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
