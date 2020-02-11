import "jest-extended";

import "../mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { isValidVersion } from "../../../../packages/core-p2p/src/utils";
import { createStubPeer } from "../../../helpers/peers";

let peerMock: P2P.IPeer;

beforeEach(async () => {
    peerMock = createStubPeer({ ip: "1.0.0.99", port: 4002 });
});

describe("isValidVersion", () => {
    it("should be a valid version", () => {
        expect(isValidVersion({ ...peerMock, ...{ version: "2.6.0" } })).toBeTrue();
        expect(isValidVersion({ ...peerMock, ...{ version: "2.6.666" } })).toBeTrue();
        expect(isValidVersion({ ...peerMock, ...{ version: "2.7.0" } })).toBeTrue();
        expect(isValidVersion({ ...peerMock, ...{ version: "2.8.0" } })).toBeTrue();
        expect(isValidVersion({ ...peerMock, ...{ version: "2.9.0" } })).toBeTrue();
        expect(isValidVersion({ ...peerMock, ...{ version: "2.9.934" } })).toBeTrue();
    });

    it("should be an invalid version", () => {
        expect(isValidVersion({ ...peerMock, ...{ version: "2.4.0" } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: "2.5.0" } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: "1.0.0" } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: "1.0" } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: "---aaa" } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: "2490" } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: 2 as any } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: -10.2 as any } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: {} as any } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: true as any } })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...({ version: () => "1" } as any) })).toBeFalse();
        expect(isValidVersion({ ...peerMock, ...{ version: "2.0.0.0" } })).toBeFalse();
    });
});
