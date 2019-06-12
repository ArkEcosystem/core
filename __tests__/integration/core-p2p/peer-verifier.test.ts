import "./mocks/core-container";

import { MockSocketManager } from "./__support__/mock-socket-server/manager";

import { P2P } from "@arkecosystem/core-interfaces";
import { PeerVerifier } from "../../../packages/core-p2p/src/peer-verifier";
import { createPeerService, createStubPeer } from "../../helpers/peers";
import { blocks2to100 as blocks2to100Json } from "../../utils/fixtures";
import { genesisBlock } from "../../utils/fixtures/unitnet/block-model";

const stubPeer: P2P.IPeer = createStubPeer({ ip: "127.0.0.1", port: 4009 });

let socketManager: MockSocketManager;
let service: P2P.IPeerService;
let claimedState: P2P.IPeerState;

beforeAll(async () => {
    process.env.CORE_ENV = "test"; // important for socket server setup (testing), see socket-server/index.ts

    ({ service } = createPeerService());

    socketManager = new MockSocketManager();
    await socketManager.init();
});

afterAll(async () => {
    socketManager.stopServer();
});

beforeEach(async () => {
    await socketManager.resetAllMocks();
    claimedState = {
        currentSlot: 1,
        forgingAllowed: true,
        height: 1,
        header: { height: 1, id: genesisBlock.data.id },
    };
});

describe("Peer Verifier", () => {
    describe("checkState", () => {
        it("identical chains", async () => {
            const peerVerifier = new PeerVerifier(service.getCommunicator(), stubPeer);
            const state = Object.assign(claimedState, { header: genesisBlock.data });
            const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
            expect(result).toBeObject();
            expect(result.forked).toBe(false);
        });

        it("different chains, including the genesis block", async () => {
            await socketManager.addMock("getCommonBlocks", { common: undefined });

            const peerVerifier = new PeerVerifier(service.getCommunicator(), stubPeer);
            const state = Object.assign(claimedState, { header: { height: 1, id: "123" } });
            const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
            expect(result).toBeUndefined();
        });

        it("contradicting heights", async () => {
            const peerVerifier = new PeerVerifier(service.getCommunicator(), stubPeer);
            const state = Object.assign(claimedState, { height: 1, header: blocks2to100Json[5] });
            const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
            expect(result).toBeUndefined();
        });

        it("garbage block header", async () => {
            const peerVerifier = new PeerVerifier(service.getCommunicator(), stubPeer);
            const garbageBlock = Object.assign({}, blocks2to100Json[0]);
            garbageBlock.numberOfTransactions = 9000;

            const state = Object.assign(claimedState, { height: 2, header: garbageBlock });
            const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
            expect(result).toBeUndefined();
        });

        it("bogus replies for common block", async () => {
            const commonBlockReplies = [
                "not an object",
                { id: { a: "id is not a string" } },
                { id: "id is string", height: "but height is not a number" },
                { id: "id is string, but none of the queried ids", height: 1 },
                { id: `${genesisBlock.data.id}`, height: 42 },
            ];

            for (const commonBlockReply of commonBlockReplies) {
                await socketManager.resetMock("getCommonBlocks");
                await socketManager.addMock("getCommonBlocks", { common: commonBlockReply });

                const peerVerifier = new PeerVerifier(service.getCommunicator(), stubPeer);
                const state = Object.assign(claimedState, { header: { height: 1, id: "123" } });
                const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
                expect(result).toBeUndefined();
            }
        });

        it("higher than our chain (invalid)", async () => {
            await socketManager.addMock("getCommonBlocks", {
                common: { id: `${genesisBlock.data.id}`, height: 1 },
            });

            const overrides = [
                // Altered payload (timestamp)
                { timestamp: 0 },
                // Wrong/non-matching signature
                { blockSignature: blocks2to100Json[1].blockSignature },
                // Wrong/non-matching signer
                { generatorPublicKey: blocks2to100Json[1].generatorPublicKey },
            ];

            for (const override of overrides) {
                const block2 = Object.assign({}, blocks2to100Json[0], override);

                await socketManager.resetMock("getBlocks");
                await socketManager.addMock("getBlocks", [block2]);

                const peerVerifier = new PeerVerifier(service.getCommunicator(), stubPeer);
                const state = Object.assign(claimedState, { header: { height: 2, id: block2.id } });
                const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
                expect(result).toBeUndefined();
            }
        });

        it("higher than our chain (legit)", async () => {
            await socketManager.addMock("getCommonBlocks", {
                common: { id: `${genesisBlock.data.id}`, height: 1 },
            });

            await socketManager.addMock("getBlocks", [blocks2to100Json[0]]);

            const peerVerifier = new PeerVerifier(service.getCommunicator(), stubPeer);
            const state = Object.assign(claimedState, { height: 2, header: blocks2to100Json[0] });
            const result = await peerVerifier.checkState(state, new Date().getTime() + 10000);
            expect(result).toBeObject();
            expect(result.forked).toBe(false);
        });
    });
});
