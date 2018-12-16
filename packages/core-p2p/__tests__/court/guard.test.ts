import dayjs from "dayjs-ext";
import { defaults } from "../../src/defaults";
import { setUp, tearDown } from "../__support__/setup";

const ARK_ENV = process.env.ARK_ENV;

let guard;
let Peer;
let peerMock;

beforeAll(async () => {
    await setUp();

    guard = require("../../dist/court/guard").guard;
    Peer = require("../../dist/peer").Peer;
});

afterAll(async () => {
    await tearDown();
});

beforeEach(async () => {
    guard.monitor.config = defaults;
    guard.monitor.peers = {};

    // this peer is here to be ready for future use in tests (not added to initial peers)
    peerMock = new Peer("1.0.0.99", 4002);
    Object.assign(peerMock, peerMock.headers);
});

describe("Guard", () => {
    describe("isSuspended", () => {
        it("should return true", async () => {
            process.env.ARK_ENV = "false";
            await guard.monitor.acceptNewPeer(peerMock);
            process.env.ARK_ENV = ARK_ENV;

            expect(guard.isSuspended(peerMock)).toBe(true);
        });

        it("should return false because passed", async () => {
            process.env.ARK_ENV = "false";
            await guard.monitor.acceptNewPeer(peerMock);
            guard.suspensions[peerMock.ip].until = dayjs().subtract(1, "minute");
            process.env.ARK_ENV = ARK_ENV;

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
});
