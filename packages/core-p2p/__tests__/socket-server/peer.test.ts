import { fork } from "child_process";
import delay from "delay";
import socketCluster from "socketcluster-client";
import { setUpFull, tearDownFull } from "../__support__/setup";

let socket;
let emit;
let mockServer;

beforeAll(async () => {
    await setUpFull();

    // launching a "mock socket server" so that we can mock a peer
    mockServer = fork(__dirname + "/../__support__/mock-socket-server/index.js");

    await delay(3000);
    socket = socketCluster.create({
        port: 4000,
        hostname: "127.0.0.1",
    });

    emit = (event, data) =>
        new Promise((resolve, reject) => {
            socket.emit(event, data, (err, val) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(val);
                }
            });
        });
});

afterAll(async () => {
    await tearDownFull();
    mockServer.kill();
});

describe("Peer socket endpoint", () => {
    const headers = {
        version: "2.1.0",
        port: "4009",
        nethash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
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
            expect(peers.peers).toBeArray();
        });

        it("should getStatus", async () => {
            const status = await emit("p2p.peer.getStatus", {
                headers,
            });
            expect(status.success).toBeTrue();
            expect(status.height).toBe(1);
        });
    });
});
