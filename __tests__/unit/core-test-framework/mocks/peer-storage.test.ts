import "jest-extended";

import { PeerStorage } from "@packages/core-test-framework/src/mocks";
import { Contracts } from "@packages/core-kernel";

let peer: Partial<Contracts.P2P.Peer> = {
    version: "2.6.0",
    latency: 200,
    ip: "127.0.0.1",
    port: 4000,
    ports: {
        "127.0.0.1": 4000,
    },
    state: {
        height: 1,
        forgingAllowed: false,
        currentSlot: 1,
        header: {},
    },
};

const clear = () => {
    PeerStorage.setPeers([]);
};

describe("PeerStorage", () => {
    describe("default values", () => {
        it("getPeers should return empty array", async () => {
            expect(PeerStorage.instance.getPeers()).toEqual([]);
        });

        it("hasPeer should return false", async () => {
            expect(PeerStorage.instance.hasPeer("127.0.0.1")).toBeFalse();
        });

        it("getPeer should return undefined", async () => {
            expect(PeerStorage.instance.getPeer("127.0.0.1")).toBeUndefined();
        });
    });

    describe("setPeers", () => {
        beforeEach(() => {
            clear();

            PeerStorage.setPeers([peer]);
        });

        it("getPeers should return mocked peer", async () => {
            expect(PeerStorage.instance.getPeers()).toEqual([peer]);
        });

        it("getPeers should return true", async () => {
            expect(PeerStorage.instance.hasPeer("127.0.0.1")).toBeTrue();
        });

        it("getPeers should return first peer", async () => {
            expect(PeerStorage.instance.getPeer("127.0.0.1")).toEqual(peer);
        });
    });
});
