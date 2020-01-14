import "jest-extended";

import os from "os";
import { isValidPeer } from "../../../../packages/crypto/src/utils/is-valid-peer";

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
        for (const iface of Object.keys(interfaces)) {
            interfaces[iface].some(iface => (addresses as any).push(iface.address));
        };

        for (const ipAddress of addresses) {
            expect(isValidPeer({ ip: ipAddress })).toBeFalse();
        };
    });

    it("should be ok", () => {
        expect(isValidPeer({ ip: "192.168.178.0" })).toBeTrue();
        expect(isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
        expect(isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
        expect(isValidPeer({ ip: "5.196.105.32" })).toBeTrue();
    });

    it("should be ok if IP is from network interface", () => {
        const ips = [
            "167.114.29.51",
            "167.114.29.52",
            "167.114.29.53",
            "167.114.29.54",
            "167.114.29.55"
        ];

        const spy = jest.spyOn(os, "networkInterfaces").mockReturnValue({
            "eth0": ips.map(ip => ({ address: ip }) as any)
        });

        for (const ip of ips) {
            expect(isValidPeer({ ip }, false)).toBeTrue();
            expect(isValidPeer({ ip })).toBeFalse();
        }

        spy.mockRestore();
    });

});
