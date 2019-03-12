import delay from "delay";
import socketCluster from "socketcluster-client";
import { setUpFull, tearDownFull } from "../__support__/setup";

let socket;
let emit;

beforeAll(async () => {
    await setUpFull();

    await delay(3000);
    socket = socketCluster.create({
        port: 4000,
        hostname: "127.0.0.1",
    });

    emit = (event, data) =>
        new Promise((resolve, reject) => {
            socket.emit(event, data, (err, val) => (err ? reject(err) : resolve(val)));
        });
});

afterAll(async () => {
    await tearDownFull();
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
            expect(peers.data.peers).toBeArray();
        });

        it("should getStatus", async () => {
            const status = await emit("p2p.peer.getStatus", {
                headers,
            });
            expect(status.data.success).toBeTrue();
            expect(status.data.height).toBe(1);
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
