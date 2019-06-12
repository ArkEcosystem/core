import "jest-extended";

import "./mocks/core-container";

import { P2P } from "../../../packages/core-interfaces/src";
import { PeerStorage } from "../../../packages/core-p2p/src/peer-storage";
import { stubPeer } from "../../helpers/peers";

let storage: P2P.IPeerStorage;

beforeEach(() => (storage = new PeerStorage()));

describe("PeerStorage", () => {
    describe("Real Peers", () => {
        it("should get the peers", () => {
            storage.setPeer(stubPeer);

            expect(storage.getPeers()).toEqual([stubPeer]);
        });

        it("should get the peer", () => {
            storage.setPeer(stubPeer);

            expect(storage.getPeer(stubPeer.ip)).toEqual(stubPeer);
        });

        it("should return true when it has a specific peers", () => {
            storage.setPeer(stubPeer);

            expect(storage.hasPeer(stubPeer.ip)).toBeTrue();
        });

        it("should return false when it doesn't have a peers", () => {
            expect(storage.hasPeer(stubPeer.ip)).toBeFalse();
        });

        it("should return true when it has any peers", () => {
            storage.setPeer(stubPeer);

            expect(storage.hasPeers()).toBeTrue();
        });

        it("should return false when it has no peers", () => {
            expect(storage.hasPeers()).toBeFalse();
        });

        it("should forgget a peer", () => {
            storage.setPeer(stubPeer);

            expect(storage.hasPeers()).toBeTrue();

            storage.forgetPeer(stubPeer);

            expect(storage.hasPeers()).toBeFalse();
        });
    });

    describe("Pending Peers", () => {
        it("should get the peers", () => {
            storage.setPendingPeer(stubPeer);

            expect(storage.getPendingPeers()).toEqual([stubPeer]);
        });

        it("should get the peer", () => {
            storage.setPendingPeer(stubPeer);

            expect(storage.getPendingPeer(stubPeer.ip)).toEqual(stubPeer);
        });

        it("should return true when it has a specific peers", () => {
            storage.setPendingPeer(stubPeer);

            expect(storage.hasPendingPeer(stubPeer.ip)).toBeTrue();
        });

        it("should return false when it doesn't have a peers", () => {
            expect(storage.hasPendingPeer(stubPeer.ip)).toBeFalse();
        });

        it("should return true when it has any peers", () => {
            storage.setPendingPeer(stubPeer);

            expect(storage.hasPendingPeers()).toBeTrue();
        });

        it("should return false when it has no peers", () => {
            expect(storage.hasPendingPeers()).toBeFalse();
        });

        it("should forgget a peer", () => {
            storage.setPendingPeer(stubPeer);

            expect(storage.hasPendingPeers()).toBeTrue();

            storage.forgetPendingPeer(stubPeer);

            expect(storage.hasPendingPeers()).toBeFalse();
        });
    });
});
