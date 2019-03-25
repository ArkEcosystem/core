import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import "../../../../utils";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

const peers = [
    {
        ip: "1.0.0.99",
        port: 4002,
        version: "2.3.0-next.3",
    },
    {
        ip: "1.0.0.98",
        port: 4002,
        version: "2.3.0-next.1",
    },
];

beforeAll(async () => {
    await setUp();

    const peerMocks = peers.map(mock => {
        const peerMock = new Peer(mock.ip, mock.port);
        peerMock.setStatus("OK");
        peerMock.version = mock.version;
        return peerMock;
    });

    const monitor = app.resolvePlugin("p2p");
    monitor.peers = peerMocks.reduce((result, mock) => ({ ...result, [mock.ip]: mock }), {});
});

afterAll(async () => {
    const monitor = app.resolvePlugin("p2p");
    monitor.peers = {};

    await tearDown();
});

describe("API 2.0 - Peers", () => {
    describe("GET /peers", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (_, request) => {
                it("should GET all the peers", async () => {
                    const response = await utils[request]("GET", "peers");
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArray();
                    expect(response.data.data[0]).toBeObject();
                });

                it("should GET all the peers sorted by version,asc", async () => {
                    const response = await utils[request]("GET", "peers", { orderBy: "version:asc" });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArrayOfSize(peers.length);
                    expect(response.data.data[0]).toBeObject();
                    expect(response.data.data[0].ip).toBe(peers[1].ip);
                    expect(response.data.data[1].ip).toBe(peers[0].ip);
                });

                it("should GET all the peers sorted by version,desc", async () => {
                    const response = await utils[request]("GET", "peers", { orderBy: "version:desc" });
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeArrayOfSize(peers.length);
                    expect(response.data.data[0]).toBeObject();
                    expect(response.data.data[0].ip).toBe(peers[0].ip);
                    expect(response.data.data[1].ip).toBe(peers[1].ip);
                });
            },
        );
    });

    describe("GET /peers/:ip", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (_, request) => {
                it("should GET a peer by the given ip", async () => {
                    const response = await utils[request]("GET", `peers/${peers[0].ip}`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();
                    expect(response.data.data.ip).toBe(peers[0].ip);
                    expect(response.data.data.port).toBe(peers[0].port);
                });
            },
        );
    });
});
