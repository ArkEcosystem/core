import "jest-extended";

import "./mocks/core-container";

import { PeerVerificationResult } from "../../../packages/core-p2p/src/peer-verifier";
import { stubPeer } from "../../helpers/peers";

describe("Peer", () => {
    it("should return the url", () => {
        expect(stubPeer.url).toBe(`http://${stubPeer.ip}:${stubPeer.port}`);
    });

    it("should return true if verified", () => {
        expect(stubPeer.isVerified()).toBeFalse();

        stubPeer.verificationResult = new PeerVerificationResult(10, 1, 5);

        expect(stubPeer.isVerified()).toBeTrue();
    });

    it("should set and get the headers", () => {
        stubPeer.setHeaders({
            nethash: "nethash",
            os: "os",
            version: "version",
        });

        expect(stubPeer.nethash).toEqual("nethash");
        expect(stubPeer.os).toEqual("os");
        expect(stubPeer.version).toEqual("version");
    });
});
