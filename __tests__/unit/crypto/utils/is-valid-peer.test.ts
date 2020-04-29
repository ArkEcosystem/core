import "jest-extended";

import { CryptoManager } from "@packages/crypto/src";
import os from "os";

let Utils;

beforeAll(() => {
    const crypto = CryptoManager.createFromPreset("devnet");
    Utils = crypto.LibraryManager.Utils;
});

describe("isValidPeer", () => {
    it("should not be ok for 127.0.0.1", () => {
        expect(Utils.isValidPeer({ ip: "127.0.0.1" })).toBeFalse();
    });

    it("should not be ok for ::ffff:127.0.0.1", () => {
        const peer = { ip: "::ffff:127.0.0.1" };
        expect(Utils.isValidPeer(peer)).toBeFalse();
    });

    it("should not be ok for 0.0.0.0", () => {
        expect(Utils.isValidPeer({ ip: "0.0.0.0" })).toBeFalse();
    });

    it("should not be ok for ::1", () => {
        const peer = { ip: "::1" };
        expect(Utils.isValidPeer(peer)).toBeFalse();
    });

    it("should not be ok for 2130706433", () => {
        const peer = { ip: "2130706433" };
        expect(Utils.isValidPeer(peer)).toBeFalse();
    });

    it("should not be ok for garbage", () => {
        expect(Utils.isValidPeer({ ip: "garbage" })).toBeFalse();
    });

    it("should not be ok for LAN addresses", () => {
        const interfaces = os.networkInterfaces();
        const addresses = [];

        // getting local addresses
        for (const iface of Object.keys(interfaces)) {
            interfaces[iface].some((iface) => (addresses as any).push(iface.address));
        }

        for (const ipAddress of addresses) {
            expect(Utils.isValidPeer({ ip: ipAddress })).toBeFalse();
        }
    });

    it("should be ok", () => {
        expect(Utils.isValidPeer({ ip: "192.168.178.0" })).toBeTrue();
        expect(Utils.isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
        expect(Utils.isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
        expect(Utils.isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
    });
});
