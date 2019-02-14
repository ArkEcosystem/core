import { app } from "@arkecosystem/core-container";
import dayjs from "dayjs-ext";
import { offences } from "../../src/court/offences";
import { defaults } from "../../src/defaults";
import { Peer } from "../../src/peer";
import { setUp, tearDown } from "../__support__/setup";

const CORE_ENV = process.env.CORE_ENV;
let guard;
let peerMock;

beforeAll(async () => {
    await setUp();

    app.getConfig().set("milestoneHash", "dummy-milestone");

    guard = require("../../src/court/guard").guard;
    guard.config.set("minimumVersions", [">=2.0.0"]);
});

afterAll(async () => {
    await tearDown();
});

beforeEach(async () => {
    guard.monitor.config = defaults;
    guard.monitor.peers = {};

    // this peer is here to be ready for future use in tests (not added to initial peers)
    peerMock = new Peer("1.0.0.99", 4002);
    peerMock.milestoneHash = "dummy-milestone";
    Object.assign(peerMock, peerMock.headers);
});

describe("Guard", () => {
    describe("isSuspended", () => {
        it("should return true", async () => {
            process.env.CORE_ENV = "false";
            await guard.monitor.acceptNewPeer(peerMock);
            process.env.CORE_ENV = CORE_ENV;

            expect(guard.isSuspended(peerMock)).toBe(true);
        });

        it("should return false because passed", async () => {
            process.env.CORE_ENV = "false";
            await guard.monitor.acceptNewPeer(peerMock);
            guard.suspensions[peerMock.ip].until = dayjs().subtract(1, "minute");
            process.env.CORE_ENV = CORE_ENV;

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
        const convertToMinutes = actual => Math.ceil(actual.diff(dayjs()) / 1000) / 60;

        const dummy = {
            nethash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
            milestoneHash: "dummy-milestone",
            version: "2.1.1",
            status: 200,
            state: {},
        };

        it('should return a 1 year suspension for "Blacklisted"', () => {
            guard.config.set("blacklist", ["dummy-ip-addr"]);

            const { until, reason } = guard.__determineOffence({
                nethash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
                milestoneHash: "dummy-milestone",
                ip: "dummy-ip-addr",
            });

            expect(reason).toBe("Blacklisted");
            expect(convertToMinutes(until)).toBe(525600);

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
                nethash: "d9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192",
                milestoneHash: "dummy-milestone",
                version: "1.0.0",
                status: 200,
                delay: 1000,
            });

            expect(reason).toBe("Invalid Version");
            expect(convertToMinutes(until)).toBe(5);
        });

        it('should return a 5 minute suspension for "Invalid Milestones"', () => {
            const { until, reason } = guard.__determineOffence({
                ...dummy,
                milestoneHash: "wrong-milestone",
            });

            expect(reason).toBe("Invalid Milestones");
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

        it('should return a 5 minutes suspension for "Invalid Response Status"', () => {
            const { until, reason } = guard.__determineOffence({
                ...dummy,
                ...{ status: 201 },
            });

            expect(reason).toBe("Invalid Response Status");
            expect(convertToMinutes(until)).toBe(5);
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

        it('should return a 30 seconds suspension for "Blockchain not ready"', () => {
            const { until, reason } = guard.__determineOffence({
                ...dummy,
                ...{ status: 503 },
            });

            expect(reason).toBe("Blockchain not ready");
            expect(convertToMinutes(until)).toBe(0.5);
        });

        it('should return a 60 seconds suspension for "Rate limit exceeded"', () => {
            const { until, reason } = guard.__determineOffence({
                ...dummy,
                ...{ status: 429 },
            });

            expect(reason).toBe("Rate limit exceeded");
            expect(convertToMinutes(until)).toBe(1);
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
