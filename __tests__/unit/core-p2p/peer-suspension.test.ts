import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { dato } from "@faustbrian/dato";
import { PeerSuspension } from "../../../packages/core-p2p/src/peer-suspension";
import { stubPeer } from "../../helpers/peers";

const offences: Record<string, P2P.IPunishment> = {
    low: {
        until: dato().addMinute(),
        reason: "low",
        severity: "low",
    },
    medium: {
        until: dato().addMinute(),
        reason: "medium",
        severity: "medium",
    },
    high: {
        until: dato().addMinute(),
        reason: "high",
        severity: "high",
    },
    critical: {
        until: dato().addMinute(),
        reason: "critical",
        severity: "critical",
    },
    unknown: {
        until: dato().addMinute(),
        reason: "unknown",
    },
    expired: {
        until: dato().subMinute(),
        reason: "unknown",
    },
    notExpired: {
        until: dato().addMinute(),
        reason: "unknown",
    },
};

describe("PeerSuspension", () => {
    it("should return true for a low severity level", () => {
        const stubSuspension: P2P.IPeerSuspension = new PeerSuspension(stubPeer, offences.low);

        expect(stubSuspension.isLow()).toBeTrue();
        expect(stubSuspension.isMedium()).toBeFalse();
        expect(stubSuspension.isHigh()).toBeFalse();
        expect(stubSuspension.isCritical()).toBeFalse();
    });

    it("should return true for a medium severity level", () => {
        const stubSuspension: P2P.IPeerSuspension = new PeerSuspension(stubPeer, offences.medium);

        expect(stubSuspension.isLow()).toBeFalse();
        expect(stubSuspension.isMedium()).toBeTrue();
        expect(stubSuspension.isHigh()).toBeFalse();
        expect(stubSuspension.isCritical()).toBeFalse();
    });

    it("should return true for a high severity level", () => {
        const stubSuspension: P2P.IPeerSuspension = new PeerSuspension(stubPeer, offences.high);

        expect(stubSuspension.isLow()).toBeFalse();
        expect(stubSuspension.isMedium()).toBeFalse();
        expect(stubSuspension.isHigh()).toBeTrue();
        expect(stubSuspension.isCritical()).toBeFalse();
    });

    it("should return true for a critical severity level", () => {
        const stubSuspension: P2P.IPeerSuspension = new PeerSuspension(stubPeer, offences.critical);

        expect(stubSuspension.isLow()).toBeFalse();
        expect(stubSuspension.isMedium()).toBeFalse();
        expect(stubSuspension.isHigh()).toBeFalse();
        expect(stubSuspension.isCritical()).toBeTrue();
    });

    it("should return false for an unknown severity", () => {
        const stubSuspension: P2P.IPeerSuspension = new PeerSuspension(stubPeer, offences.unknown);

        expect(stubSuspension.isLow()).toBeFalse();
        expect(stubSuspension.isMedium()).toBeFalse();
        expect(stubSuspension.isHigh()).toBeFalse();
        expect(stubSuspension.isCritical()).toBeFalse();
    });

    it("should return true if the suspension has expired", () => {
        const stubSuspension: P2P.IPeerSuspension = new PeerSuspension(stubPeer, offences.expired);

        expect(stubSuspension.hasExpired()).toBeTrue();
    });

    it("should return true if the suspension hasn't xpired", () => {
        const stubSuspension: P2P.IPeerSuspension = new PeerSuspension(stubPeer, offences.notExpired);

        expect(stubSuspension.hasExpired()).toBeFalse();
    });
});
