import { setUpFull, tearDownFull } from "./__support__/setup";

import { fork } from "child_process";
import delay from "delay";
let peer;
let localConfig;
let mockServer;

beforeAll(async () => {
    await setUpFull();

    // launching a "mock socket server" so that we can mock a peer
    // In order for all this mocking to work, we must disable (in the code, didn't manage otherwise)
    // the isLocalHost() check in is-valid-peer.ts so that we can have local peers
    mockServer = fork(__dirname + "/__support__/mock-socket-server/index.js");

    await delay(2000);
});

afterAll(async () => {
    await tearDownFull();

    mockServer.kill();
});

beforeEach(() => {
    localConfig = require("../src/config").config;

    localConfig.init({});
    localConfig.set("port", 4009); // we mock a peer on localhost:4009

    const { Peer } = require("../src/peer");
    peer = new Peer("127.0.0.1", 8000);
    // the "real" peer (the app we launched with setupFull) is listening on port 8000
});

describe("Peer", () => {
    describe("ping", () => {
        it("should be ok", async () => {
            // we ping the peer on port 8000.
            // we do this with headers sets with port = 4009
            // so the app will attempt to ping us back on 4009 where our socket server mock is listening
            // => 127.0.0.1:4009 should be added as a peer in the app (real peer - 8000)

            const status = await peer.ping(1000);

            expect(status.success).toBeTrue();

            await delay(3000);

            const peers = await peer.getPeers();
            expect(peers).toHaveLength(1);
            expect(peers[0].ip).toBe("127.0.0.1");
            expect(peers[0].port).toBe(4009);
        });
    });
});
