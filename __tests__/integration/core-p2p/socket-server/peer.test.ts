import "../mocks/core-container";

import delay from "delay";
import socketCluster from "socketcluster-client";
import { startSocketServer } from "../../../../packages/core-p2p/src/socket-server";
import { monitor } from "../../../../packages/core-p2p/src/monitor";
import genesisBlockJSON from "../../../utils/config/unitnet/genesisBlock.json";

let socket;
let emit;
let server;

beforeAll(async () => {
    process.env.CORE_ENV = "test";
    server = await startSocketServer({ port: 4000 });
    await delay(3000);
    socket = socketCluster.create({
        port: 4000,
        hostname: "127.0.0.1",
    });

    emit = (event, data) =>
        new Promise((resolve, reject) => {
            socket.emit(event, data, (err, val) => (err ? reject(err) : resolve(val)));
        });

    jest.spyOn(monitor, "acceptNewPeer").mockImplementation(async () => {});
});

afterAll(() => {
    socket.destroy();
});

describe("Peer socket endpoint", () => {
    const headers = {
        version: "2.1.0",
        port: "4009",
        nethash: "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348",
        milestoneHash: "519afa9b68898c31",
        height: 1,
        "Content-Type": "application/json",
        hashid: "4e41294e",
    };

    describe("socket endpoints", () => {
        it("should getPeers", async () => {
            const peers = await emit("p2p.peer.getPeers", {
                headers,
            });
            expect(peers.data.peers).toBeArray();
        });

        it("should getStatus", async () => {
            const status = await emit("p2p.peer.getStatus", {
                headers,
            });
            expect(status.data.success).toBeTrue();
            expect(status.data.height).toBe(1);
        });

        describe("postBlock", () => {
            it("should postBlock successfully", async () => {
                const status = await emit("p2p.peer.postBlock", {
                    data: { block: genesisBlockJSON },
                    headers,
                });
                expect(status.data.success).toBeTrue();
            });

            it("should throw validation error when sending wrong data", async () => {
                await expect(
                    emit("p2p.peer.postBlock", {
                        data: {},
                        headers,
                    }),
                ).rejects.toHaveProperty("name", "CoreValidationError");
            });
        });
    });

    describe("Socket errors", () => {
        it("should send back an error if no data.headers", async () => {
            try {
                const peers = await emit("p2p.peer.getPeers", {});
            } catch (e) {
                expect(e.name).toEqual("CoreHeadersRequiredError");
                expect(e.message).toEqual("Request data and data.headers is mandatory");
            }
        });
    });
});
