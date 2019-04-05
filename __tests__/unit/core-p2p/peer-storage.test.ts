import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces/src";
import { dato } from "@faustbrian/dato";
import fs from "fs";
import { Peer } from "../../../packages/core-p2p/src";
import { PeerStorage } from "../../../packages/core-p2p/src/peer-storage";

jest.mock("fs");

const stubPeer: P2P.IPeer = new Peer("1.2.3.4", 4000);
const stubSuspension: P2P.ISuspension = {
    peer: stubPeer,
    punishment: {
        until: dato(),
        reason: "reason",
        weight: 1,
        critical: false,
    },
};

let storage: P2P.IPeerStorage;
beforeEach(() => {
    storage = new PeerStorage();
});

describe("PeerStorage", () => {
    it("should get the peers", () => {
        storage.setPeer(stubPeer);

        expect(storage.getPeers()).toEqual([stubPeer]);
    });

    it("should get the peer", () => {
        storage.setPeer(stubPeer);

        expect(storage.getPeer(stubPeer.ip)).toEqual(stubPeer);
    });

    it("should return true when it has peers", () => {
        storage.setPeer(stubPeer);

        expect(storage.hasPeers()).toBeTrue();
    });

    it("should return false when it has no peer", () => {
        expect(storage.hasPeers()).toBeFalse();
    });

    it("should remove the peer", () => {
        storage.setPeer(stubPeer);

        expect(storage.hasPeers()).toBeTrue();

        storage.forgetPeer(stubPeer);

        expect(storage.hasPeers()).toBeFalse();
    });

    it("should get the suspended peers from guard.all()", () => {
        storage.setSuspendedPeer(stubSuspension);

        expect(storage.getSuspendedPeers()).toEqual([stubSuspension]);
    });

    it("should cache the peers into file", () => {
        stubPeer.version = "2.3.0";
        storage.setPeer(stubPeer);

        process.env.CORE_PATH_CACHE = ".";

        storage.savePeers();

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            "./peers.json",
            JSON.stringify(
                storage.getPeers().map(peer => ({
                    ip: peer.ip,
                    port: peer.port,
                    version: peer.version,
                })),
            ),
        );
    });
});
