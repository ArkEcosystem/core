import "jest-extended";
import "./mocks/core-container";

import { dato } from "@faustbrian/dato";
import delay from "delay";
import nock from "nock";
import { config as localConfig } from "../../../packages/core-p2p/src/config";
import { defaults } from "../../../packages/core-p2p/src/defaults";
import { guard } from "../../../packages/core-p2p/src/guard";
import { monitor } from "../../../packages/core-p2p/src/monitor";
import { Peer } from "../../../packages/core-p2p/src/peer";
import { SocketErrors } from "../../../packages/core-p2p/src/socket-server/constants";

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
    nock.cleanAll();
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

    describe("suspend", () => {
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

        it('should return a 1 year suspension for "Blacklisted"', () => {
            guard.config.set("blacklist", ["dummy-ip-addr"]);

            guard.suspend({
                nethash: "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348",
                ip: "dummy-ip-addr",
            });

            const { until, reason } = guard.get(dummy.ip);

            expect(reason).toBe("Blacklisted");
            expect(convertToMinutes(until)).toBeGreaterThanOrEqual(525600);

            guard.config.set("blacklist", []);
        });

        it('should return a 5 minutes suspension for "No Common Blocks"', () => {
            guard.suspend({
                ...dummy,
                ...{
                    commonBlocks: false,
                },
            });

            const { until, reason } = guard.get(dummy.ip);

            expect(reason).toBe("No Common Blocks");
            expect(convertToMinutes(until)).toBe(5);
        });

        it('should return a 5 minute suspension for "Invalid Version"', () => {
            guard.suspend({
                ...dummy,
                version: "1.0.0",
            });

            const { until, reason } = guard.get(dummy.ip);

            expect(reason).toBe("Invalid Version");
            expect(convertToMinutes(until)).toBe(5);
        });

        it('should return a 2 minutes suspension for "Timeout"', () => {
            guard.suspend({
                ...dummy,
                ...{ delay: -1 },
            });

            const { until, reason } = guard.get(dummy.ip);

            expect(reason).toBe("Timeout");
            expect(convertToMinutes(until)).toBe(0.5);
        });

        it('should return a 1 minutes suspension for "High Latency"', () => {
            guard.suspend({
                ...dummy,
                ...{ delay: 3000 },
            });

            const { until, reason } = guard.get(dummy.ip);

            expect(reason).toBe("High Latency");
            expect(convertToMinutes(until)).toBe(1);
        });

        it('should return a 30 seconds suspension for "Application not ready"', () => {
            guard.suspend({
                ...dummy,
                socketError: SocketErrors.AppNotReady,
            });

            const { until, reason } = guard.get(dummy.ip);

            expect(reason).toBe("Application is not ready");
            expect(convertToMinutes(until)).toBe(0.5);
        });

        it('should return a 10 minutes suspension for "Unknown"', () => {
            guard.suspend(dummy);

            const { until, reason } = guard.get(dummy.ip);

            expect(reason).toBe("Unknown");
            expect(convertToMinutes(until)).toBe(10);
        });
    });
});
