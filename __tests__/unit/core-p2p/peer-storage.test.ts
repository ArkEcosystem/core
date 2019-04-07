import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces/src";
import { dato } from "@faustbrian/dato";
import fs from "fs";
import { PeerStorage } from "../../../packages/core-p2p/src/peer-storage";
import { PeerSuspension } from "../../../packages/core-p2p/src/peer-suspension";
import { stubPeer } from "../../helpers/peers";

jest.mock("fs");

const stubSuspension: P2P.IPeerSuspension = new PeerSuspension(stubPeer, {
    until: dato(),
    reason: "reason",
    severity: "critical",
});

let storage: P2P.IPeerStorage;

beforeEach(() => {
    storage = new PeerStorage();
});

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

    describe("Suspended Peers", () => {
        it("should get the peers", () => {
            storage.setSuspendedPeer(stubSuspension);

            expect(storage.getSuspendedPeers()).toEqual([stubSuspension]);
        });

        it("should get the peer", () => {
            storage.setSuspendedPeer(stubSuspension);

            expect(storage.getSuspendedPeer(stubPeer.ip)).toEqual(stubSuspension);
        });

        it("should return true when it has a specific peers", () => {
            storage.setSuspendedPeer(stubSuspension);

            expect(storage.hasSuspendedPeer(stubPeer.ip)).toBeTrue();
        });

        it("should return false when it doesn't have a peers", () => {
            expect(storage.hasSuspendedPeer(stubPeer.ip)).toBeFalse();
        });

        it("should return true when it has any peers", () => {
            storage.setSuspendedPeer(stubSuspension);

            expect(storage.hasSuspendedPeers()).toBeTrue();
        });

        it("should return false when it has no peers", () => {
            expect(storage.hasSuspendedPeers()).toBeFalse();
        });

        it("should forgget a peer", () => {
            storage.setSuspendedPeer(stubSuspension);

            expect(storage.hasSuspendedPeers()).toBeTrue();

            storage.forgetSuspendedPeer(stubPeer);

            expect(storage.hasSuspendedPeers()).toBeFalse();
        });
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
