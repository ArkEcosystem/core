import os from "os";
import isMyself from "../../src/utils/is-myself";

describe("isMyself", () => {
    it("should be ok for localhost addresses", () => {
        expect(isMyself("127.0.0.1")).toBeTrue();

        expect(isMyself("192.167.22.1")).toBeFalse();
    });

    it("should be ok for LAN addresses", () => {
        const interfaces = os.networkInterfaces();
        const addresses = [];

        // getting local addresses
        Object.keys(interfaces).forEach(ifname => {
            interfaces[ifname].some(iface => (addresses as any).push(iface.address));
        });

        addresses.forEach(ipAddress => {
            expect(isMyself(ipAddress)).toBeTrue();
        });
    });
});
