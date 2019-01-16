/* tslint:disable:max-line-length  */
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { defaults } from "../dist/defaults";
import { Peer } from "../dist/peer";
import { setUp, tearDown } from "./__support__/setup";

const axiosMock = new MockAdapter(axios);

let peerMock: Peer;
let monitor;

beforeAll(async () => {
    await setUp();
    monitor = require("../dist/monitor").monitor;
});

afterAll(async () => {
    await tearDown();
});

beforeEach(async () => {
    monitor.config = defaults;

    const initialPeersMock = {};
    ["1.0.0.0", "1.0.0.1", "1.0.0.2", "1.0.0.3", "1.0.0.4"].forEach(ip => {
        const initialPeer = new Peer(ip, 4000);
        initialPeersMock[ip] = Object.assign(initialPeer, initialPeer.headers, {
            ban: 0,
        });
    });

    monitor.peers = initialPeersMock;

    peerMock = new Peer("1.0.0.99", 4000); // this peer is just here to be picked up by tests below (not added to initial peers)
    Object.assign(peerMock, peerMock.headers, { status: 200 });
    peerMock.nethash = "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192";

    axiosMock.reset(); // important: resets any existing mocking behavior
});

describe("Monitor", () => {
    describe("cleanPeers", () => {
        it("should be ok", async () => {
            const previousLength = Object.keys(monitor.peers).length;

            await monitor.cleanPeers(true);

            expect(Object.keys(monitor.peers).length).toBeLessThan(previousLength);
        });
    });

    describe("acceptNewPeer", () => {
        it("should be ok", async () => {
            axiosMock.onGet(`${peerMock.url}/peer/status`).reply(() => [200, { success: true }, peerMock.headers]);
            process.env.CORE_ENV = "false";

            await monitor.acceptNewPeer(peerMock);

            expect(monitor.peers[peerMock.ip]).toBeObject();

            process.env.CORE_ENV = "test";
        });
    });

    describe("getPeers", () => {
        it("should be ok", async () => {
            const peers = monitor.getPeers();

            expect(peers).toBeArray();
            expect(peers.length).toBe(5); // 5 from peers.json
        });
    });

    describe("getRandomPeer", () => {
        it("should be ok", async () => {
            const peer = monitor.getRandomPeer();

            expect(peer).toBeObject();
            expect(peer).toHaveProperty("ip");
            expect(peer).toHaveProperty("port");
        });
    });

    describe("getRandomDownloadBlocksPeer", () => {
        it("should be ok", async () => {
            axiosMock
                .onGet(/.*\/peer\/blocks\/common/)
                .reply(() => [200, { success: true, common: true }, peerMock.headers]);
            const peer = await monitor.getRandomDownloadBlocksPeer();

            expect(peer).toBeObject();
            expect(peer).toHaveProperty("ip");
            expect(peer).toHaveProperty("port");
        });
    });

    describe("discoverPeers", () => {
        it("should be ok", async () => {
            axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { success: true }, peerMock.headers]);
            axiosMock
                .onGet(/.*\/peer\/list/)
                .reply(() => [200, { peers: [peerMock.toBroadcastInfo()] }, peerMock.headers]);

            await monitor.discoverPeers();
            const peers = monitor.getPeers();

            expect(peers).toBeArray();
            expect(Object.keys(peers).length).toBe(6); // 5 from initial peers + 1 from peerMock
            expect(peers.find(e => e.ip === peerMock.ip)).toBeDefined();
        });
    });

    describe("getNetworkHeight", () => {
        it("should be ok", async () => {
            axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { success: true, height: 2 }, peerMock.headers]);
            axiosMock.onGet(/.*\/peer\/list/).reply(() => [200, { peers: [] }, peerMock.headers]);
            await monitor.discoverPeers();

            const height = await monitor.getNetworkHeight();
            expect(height).toBe(2);
        });

        // TODO test with peers with different heights (use replyOnce) and check that median is OK
    });

    describe("getPBFTForgingStatus", () => {
        it("should be ok", async () => {
            axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { success: true, height: 2 }, peerMock.headers]);
            axiosMock.onGet(/.*\/peer\/list/).reply(() => [200, { peers: [] }, peerMock.headers]);

            await monitor.discoverPeers();
            const pbftForgingStatus = monitor.getPBFTForgingStatus();

            expect(pbftForgingStatus).toBeNumber();
            // TODO test mocking peers currentSlot & forgingAllowed
        });
    });

    describe("downloadBlocks", () => {
        it("should be ok", async () => {
            axiosMock
                .onGet(/.*\/peer\/blocks\/common/)
                .reply(() => [200, { success: true, common: true }, peerMock.headers]);
            axiosMock.onGet(/.*\/peer\/status/).reply(() => [200, { success: true, height: 2 }, peerMock.headers]);
            axiosMock
                .onGet(/.*\/peer\/blocks/)
                .reply(() => [200, { blocks: [{ id: 1 }, { id: 2 }] }, peerMock.headers]);

            const blocks = await monitor.downloadBlocks(1);

            expect(blocks).toBeArray();
            expect(blocks.length).toBe(2);
        });
    });
});
