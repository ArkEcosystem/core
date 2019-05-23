import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import dayjs from "dayjs";
import { PeerGuard } from "../../../packages/core-p2p/src/peer-guard";
import { createStubPeer } from "../../helpers/peers";

let guard: P2P.IPeerGuard;

beforeAll(async () => {
    guard = new PeerGuard();
});

describe("PeerGuard", () => {
    describe("analyze", () => {
        const convertToMinutes = actual => Math.ceil(actual.diff(dayjs()) / 1000) / 60;

        const dummy = createStubPeer({
            ip: "dummy-ip-addr",
            version: "2.1.1",
            status: 200,
            state: {},
            socket: {
                getState: () => "open",
                OPEN: "open",
            },
        });

        it('should return a 5 minutes suspension for "No Common Blocks"', () => {
            const { until, reason } = guard.punishment("noCommonBlocks");

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

        it('should return a 1 minutes suspension for "High Latency"', () => {
            const { until, reason } = guard.analyze({
                ...dummy,
                ...{ latency: 3000 },
            });

            expect(reason).toBe("High Latency");
            expect(convertToMinutes(until)).toBe(1);
        });
    });
});
