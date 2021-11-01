import { mapAddr } from "@arkecosystem/core-p2p/src/socket-server/utils/map-addr";

describe("mapAddr", () => {
    it("should map IP 'v6' to IP v4 counterpart", () => {
        const ipv6 = "::ffff:192.168.1.1";
        const ipv4 = "192.168.1.1";
        expect(mapAddr(ipv6)).toBe(ipv4);
    });

    it("should map a real IP v6 to itself", () => {
        const ipv6 = "2001:db8:3312::1";
        expect(mapAddr(ipv6)).toBe(ipv6);
    });
});
