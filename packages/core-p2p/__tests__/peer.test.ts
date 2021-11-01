import { Peer } from "@arkecosystem/core-p2p/src/peer";
import { PeerVerificationResult } from "@arkecosystem/core-p2p/src/peer-verifier";
import dayjs from "dayjs";
import { Contracts } from "@arkecosystem/core-kernel";

describe("Peer", () => {
    let peer: Peer;

    const ip = "167.184.53.78";
    const port = 4000;

    beforeEach(() => {
        peer = new Peer(ip, port);
    });

    describe("url", () => {
        it("should return http url", () => {
            expect(peer.url).toBe(`http://${ip}:${port}`);
        });

        it.each([[443, 886]])("should return https url when port is multiple of 443", (httpsPort) => {
            const httpsPeer = new Peer(ip, httpsPort);

            expect(httpsPeer.url).toBe(`https://${ip}:${httpsPort}`);
        });
    });

    describe("isVerified", () => {
        it("should return true when this.verificationResult is instanceof PeerVerificationResult", () => {
            peer.verificationResult = new PeerVerificationResult(12, 12, 12);

            expect(peer.isVerified()).toBeTrue();
        });

        it("should return false when this.verificationResult is undefined", () => {
            peer.verificationResult = undefined;

            expect(peer.isVerified()).toBeFalse();
        });
    });

    describe("isForked", () => {
        it("should return true when this.verificationResult.forked", () => {
            peer.verificationResult = new PeerVerificationResult(12, 12, 8);

            expect(peer.isForked()).toBeTrue();
        });

        it("should return false when this.verificationResult is undefined", () => {
            peer.verificationResult = undefined;

            expect(peer.isForked()).toBeFalse();
        });

        it("should return false when this.verificationResult.forked is false", () => {
            peer.verificationResult = new PeerVerificationResult(12, 12, 12);

            expect(peer.isForked()).toBeFalse();
        });
    });

    describe("recentlyPinged", () => {
        it("should return true when lastPinged is less than 2 minutes ago", () => {
            peer.lastPinged = dayjs();

            expect(peer.recentlyPinged()).toBeTrue();
        });

        it("should return false when lastPinged is more than 2 minutes ago", () => {
            peer.lastPinged = dayjs().subtract(2, "minute");

            expect(peer.recentlyPinged()).toBeFalse();
        });
    });

    describe("toBroadcast", () => {
        it("should return a Contracts.P2P.PeerBroadcast object for peer properties", () => {
            peer.version = "3.0.1";
            peer.state.height = 19;
            peer.latency = 135;

            const expectedBroadcast: Contracts.P2P.PeerBroadcast = {
                ip,
                port: 4000,
            };

            expect(peer.toBroadcast()).toEqual(expectedBroadcast);
        });
    });
});
