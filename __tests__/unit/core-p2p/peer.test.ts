import "jest-extended";
import { IPeer } from "../../../packages/core-p2p/src/interfaces";
import { Peer } from "../../../packages/core-p2p/src/peer";
import { PeerVerificationResult } from "../../../packages/core-p2p/src/peer-verifier";

const dummy = { ip: "127.0.0.1", port: 4000 };

let peer: IPeer;
beforeEach(() => {
    peer = new Peer(dummy.ip, dummy.port);
});

describe("Peer", () => {
    it("should return the url", () => {
        expect(peer.getUrl()).toBe(`http://${dummy.ip}:${dummy.port}`);
    });

    it("should return true if verified", () => {
        expect(peer.isVerified()).toBeFalse();

        peer.verificationResult = new PeerVerificationResult(10, 1, 5);

        expect(peer.isVerified()).toBeTrue();
    });

    it("should set and get the headers", () => {
        peer.setHeaders({
            nethash: "nethash",
            os: "os",
            version: "version",
        });

        expect(peer.nethash).toEqual("nethash");
        expect(peer.os).toEqual("os");
        expect(peer.version).toEqual("version");
    });
});
