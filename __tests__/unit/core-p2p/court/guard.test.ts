import "../mocks/core-container";

import { dato } from "@faustbrian/dato";
import { config as localConfig } from "../../../../packages/core-p2p/src/config";
import { guard } from "../../../../packages/core-p2p/src/court/guard";
import { offences } from "../../../../packages/core-p2p/src/court/offences";
import { defaults } from "../../../../packages/core-p2p/src/defaults";
import { monitor } from "../../../../packages/core-p2p/src/monitor";
import { Peer } from "../../../../packages/core-p2p/src/peer";
import { SocketErrors } from "../../../../packages/core-p2p/src/socket-server/constants";

import delay from "delay";

let peerMock;

beforeAll(async () => {
    localConfig.init(defaults);

    monitor.config = localConfig;
    monitor.guard = guard;
    monitor.guard.init(monitor);

    guard.config.set("minimumVersions", [">=2.0.0"]);

    // this peer is here to be ready for future use in tests (not added to initial peers)
    peerMock = new Peer("1.0.0.99", 4002);
    Object.assign(peerMock, peerMock.headers);
    peerMock.nethash = "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348";

    await delay(500);
});

afterAll(() => {
    peerMock.socket.destroy();
});

describe("Guard", () => {
    describe("isSuspended", () => {
        it("should return true", async () => {
            await guard.monitor.acceptNewPeer(peerMock);

            expect(guard.isSuspended(peerMock)).toBe(true);
        });

        it("should return false because passed", async () => {
            await guard.monitor.acceptNewPeer(peerMock);
            guard.suspensions[peerMock.ip].until = dato().subMinutes(1);

            expect(guard.isSuspended(peerMock)).toBe(false);
        });

        it("should return false because not suspended", () => {
            expect(guard.isSuspended(peerMock)).toBe(false);
        });
    });

    describe("isRepeatOffender", () => {
        it("should be true if the threshold is met", () => {
            const peer = { offences: [] };

            for (let i = 0; i < 10; i++) {
                peer.offences.push({ weight: 10 });
            }

            expect(guard.isRepeatOffender(peer)).toBeFalse();
        });

        it("should be false if the threshold is not met", () => {
            const peer = { offences: [] };

            for (let i = 0; i < 15; i++) {
                peer.offences.push({ weight: 10 });
            }

            expect(guard.isRepeatOffender(peer)).toBeTrue();
        });
    });

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

    describe("__determineOffence", () => {
        const convertToMinutes = actual => Math.ceil(actual.diff(dato()) / 1000) / 60;

        const dummy = {
            nethash: "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348",
            version: "2.1.1",
            status: 200,
            state: {},
            socket: {
                getState: () => "open",
                OPEN: "open",
            },
        };

        it('should return a 1 year suspension for "Blacklisted"', () => {
            guard.config.set("blacklist", ["dummy-ip-addr"]);

            const { until, reason } = guard.__determineOffence({
                nethash: "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348",
                ip: "dummy-ip-addr",
            });

            expect(reason).toBe("Blacklisted");
            expect(convertToMinutes(until)).toBeGreaterThanOrEqual(525600);

            guard.config.set("blacklist", []);
        });

        it('should return a 5 minutes suspension for "No Common Blocks"', () => {
            const { until, reason } = guard.__determineOffence({
                ...dummy,
                ...{
                    commonBlocks: false,
                },
            });

            expect(reason).toBe("No Common Blocks");
            expect(convertToMinutes(until)).toBe(5);
        });

        it('should return a 5 minute suspension for "Invalid Version"', () => {
            const { until, reason } = guard.__determineOffence({
                nethash: "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348",
                version: "1.0.0",
                status: 200,
                delay: 1000,
                socket: {
                    OPEN: "open",
                    getState: () => "open",
                },
            });

            expect(reason).toBe("Invalid Version");
            expect(convertToMinutes(until)).toBe(5);
        });

        it('should return a 10 minutes suspension for "Node is not at height"', () => {
            guard.monitor.getNetworkHeight = jest.fn(() => 154);

            const { until, reason } = guard.__determineOffence({
                ...dummy,
                state: {
                    height: 1,
                },
            });

            expect(reason).toBe("Node is not at height");
            expect(convertToMinutes(until)).toBe(10);
        });

        it('should return a 2 minutes suspension for "Timeout"', () => {
            const { until, reason } = guard.__determineOffence({
                ...dummy,
                ...{ delay: -1 },
            });

            expect(reason).toBe("Timeout");
            expect(convertToMinutes(until)).toBe(2);
        });

        it('should return a 1 minutes suspension for "High Latency"', () => {
            const { until, reason } = guard.__determineOffence({
                ...dummy,
                ...{ delay: 3000 },
            });

            expect(reason).toBe("High Latency");
            expect(convertToMinutes(until)).toBe(1);
        });

        it('should return a 30 seconds suspension for "Application not ready"', () => {
            const { until, reason } = guard.__determineOffence({
                ...dummy,
                socketError: SocketErrors.AppNotReady,
            });

            expect(reason).toBe("Application is not ready");
            expect(convertToMinutes(until)).toBe(0.5);
        });

        it('should return a 10 minutes suspension for "Unknown"', () => {
            const { until, reason } = guard.__determineOffence(dummy);

            expect(reason).toBe("Unknown");
            expect(convertToMinutes(until)).toBe(10);
        });
    });

    describe("__determinePunishment", () => {
        it("should be true if the threshold is met", () => {
            const actual = guard.__determinePunishment({}, offences.REPEAT_OFFENDER);

            expect(actual).toHaveProperty("until");
            expect(actual.until).toBeObject();

            expect(actual).toHaveProperty("reason");
            expect(actual.reason).toBeString();

            expect(actual).toHaveProperty("weight");
            expect(actual.weight).toBeNumber();
        });
    });
});
