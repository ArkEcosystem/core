import "jest-extended";
import "./mocks/core-container";

import { dato } from "@faustbrian/dato";
import { config as localConfig } from "../../../packages/core-p2p/src/config";
import { defaults } from "../../../packages/core-p2p/src/defaults";
import { SocketErrors } from "../../../packages/core-p2p/src/enums";
import { Peer } from "../../../packages/core-p2p/src/peer";
import { PeerConnector } from "../../../packages/core-p2p/src/peer-connector";
import { PeerGuard } from "../../../packages/core-p2p/src/peer-guard";

let peerMock;
let guard;
beforeAll(async () => {
    localConfig.init(defaults);

    guard = new PeerGuard(new PeerConnector());

    localConfig.set("minimumVersions", [">=2.0.0"]);

    // this peer is here to be ready for future use in tests (not added to initial peers)
    peerMock = new Peer("1.0.0.99", 4002);
    Object.assign(peerMock, peerMock.headers);
    peerMock.nethash = "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348";
});

describe("Guard", () => {
    describe("isValidVersion", () => {
        it("should be a valid version", () => {
            expect(guard.isValidVersion({ version: "2.0.0" })).toBeTrue();
            expect(guard.isValidVersion({ version: "2.1.39" })).toBeTrue();
            expect(guard.isValidVersion({ version: "3.0.0" })).toBeTrue();
        });

        it("should be an invalid version", () => {
            expect(guard.isValidVersion({ version: "1.0.0" })).toBeFalse();
            expect(guard.isValidVersion({ version: "1.0" })).toBeFalse();
            expect(guard.isValidVersion({ version: "---aaa" })).toBeFalse();
            expect(guard.isValidVersion({ version: "2490" })).toBeFalse();
            expect(guard.isValidVersion({ version: 2 })).toBeFalse();
            expect(guard.isValidVersion({ version: -10.2 })).toBeFalse();
            expect(guard.isValidVersion({ version: {} })).toBeFalse();
            expect(guard.isValidVersion({ version: true })).toBeFalse();
            expect(guard.isValidVersion({ version: () => "1" })).toBeFalse();
            expect(guard.isValidVersion({ version: "2.0.0.0" })).toBeFalse();
        });
    });

    describe("analyze", () => {
        const convertToMinutes = actual => Math.ceil(actual.diff(dato()) / 1000) / 60;

        const dummy = {
            ip: "dummy-ip-addr",
            nethash: "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348",
            version: "2.1.1",
            status: 200,
            state: {},
            socket: {
                getState: () => "open",
                OPEN: "open",
            },
        };

        it('should return a 5 minutes suspension for "No Common Blocks"', () => {
            const { until, reason } = guard.analyze({
                ...dummy,
                ...{
                    commonBlocks: false,
                },
            });

            expect(reason).toBe("No Common Blocks");
            expect(convertToMinutes(until)).toBe(5);
        });

        it('should return a 5 minute suspension for "Invalid Version"', () => {
            const { until, reason } = guard.analyze({
                ...dummy,
                version: "1.0.0",
            });

            expect(reason).toBe("Invalid Version");
            expect(convertToMinutes(until)).toBe(5);
        });

        it('should return a 2 minutes suspension for "Timeout"', () => {
            const { until, reason } = guard.analyze({
                ...dummy,
                ...{ delay: -1 },
            });

            expect(reason).toBe("Timeout");
            expect(convertToMinutes(until)).toBe(0.5);
        });

        it('should return a 1 minutes suspension for "High Latency"', () => {
            const { until, reason } = guard.analyze({
                ...dummy,
                ...{ delay: 3000 },
            });

            expect(reason).toBe("High Latency");
            expect(convertToMinutes(until)).toBe(1);
        });

        it('should return a 30 seconds suspension for "Application not ready"', () => {
            const { until, reason } = guard.analyze({
                ...dummy,
                socketError: SocketErrors.AppNotReady,
            });

            expect(reason).toBe("Application is not ready");
            expect(convertToMinutes(until)).toBe(0.5);
        });
    });
});
