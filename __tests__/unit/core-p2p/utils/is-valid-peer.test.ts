import os from "os";
import { isValidPeer } from "../../../../packages/core-p2p/src/utils";

describe("isValidPeer", () => {
    it("should not be ok for 127.0.0.1", () => {
        expect(isValidPeer({ ip: "127.0.0.1" })).toBeFalse();
    });

    it("should not be ok for ::ffff:127.0.0.1", () => {
        const peer = { ip: "::ffff:127.0.0.1" };
        expect(isValidPeer(peer)).toBeFalse();
    });

    it("should not be ok for 0.0.0.0", () => {
        expect(isValidPeer({ ip: "0.0.0.0" })).toBeFalse();
    });

    it("should not be ok for ::1", () => {
        const peer = { ip: "::1" };
        expect(isValidPeer(peer)).toBeFalse();
    });

    it("should not be ok for 2130706433", () => {
        const peer = { ip: "2130706433" };
        expect(isValidPeer(peer)).toBeFalse();
    });

    it("should not be ok for garbage", () => {
        expect(isValidPeer({ ip: "garbage" })).toBeFalse();
    });

    it("should not be ok for LAN addresses", () => {
        const interfaces = os.networkInterfaces();
        const addresses = [];

        // getting local addresses
        Object.keys(interfaces).forEach(ifname => {
            interfaces[ifname].some(iface => (addresses as any).push(iface.address));
        });

        addresses.forEach(ipAddress => {
            expect(isValidPeer({ ip: ipAddress })).toBeFalse();
        });
    });

    it("should be ok", () => {
        expect(isValidPeer({ ip: "192.168.178.0" })).toBeTrue();
        expect(isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
        expect(isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
        expect(isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
    });
});
