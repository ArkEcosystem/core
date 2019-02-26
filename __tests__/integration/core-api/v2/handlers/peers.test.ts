import { app } from "@arkecosystem/core-container";
import { Peer } from "@arkecosystem/core-p2p/src/peer";
import "../../../../utils";
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
            },
        );
    });

    describe("GET /peers/:ip", () => {
        describe.each([["API-Version", "request"], ["Accept", "requestWithAcceptHeader"]])(
            "using the %s header",
            (_, request) => {
                it("should GET a peer by the given ip", async () => {
                    const response = await utils[request]("GET", `peers/${mockAddress}`);
                    expect(response).toBeSuccessfulResponse();
                    expect(response.data.data).toBeObject();
                    expect(response.data.data.ip).toBe(mockAddress);
                    expect(response.data.data.port).toBe(mockPort);
                });
            },
        );
    });
});
