import { arkToSatoshi, parseFee, satoshiToArk } from "../../../packages/core-tester-cli/src/utils";

describe("Utils", () => {
    describe("parseFee", () => {
        it("should give satoshi", () => {
            expect(parseFee(0.1).toString()).toBe("10000000");
            expect(parseFee(1).toString()).toBe("100000000");
            expect(parseFee(10).toString()).toBe("1000000000");
            expect(parseFee("0.1").toString()).toBe("10000000");
            expect(parseFee("1").toString()).toBe("100000000");
            expect(parseFee("10").toString()).toBe("1000000000");
            expect(parseFee("0.001-0.005").toNumber()).toBeWithin(100000, 500000);
        });
    });

    describe("arkToSatoshi", () => {
        it("should give satoshi", () => {
            expect(arkToSatoshi(0.00000001).toString()).toBe("1");
            expect(arkToSatoshi(0.1).toString()).toBe("10000000");
            expect(arkToSatoshi(1).toString()).toBe("100000000");
            expect(arkToSatoshi(10).toString()).toBe("1000000000");
        });
    });

    describe("satoshiToArk", () => {
        it("should give ark", () => {
            expect(satoshiToArk(1)).toBe("0.00000001 DѦ");
            expect(satoshiToArk(10000000)).toBe("0.1 DѦ");
            expect(satoshiToArk(100000000)).toBe("1 DѦ");
            expect(satoshiToArk(1000000000)).toBe("10 DѦ");
        });
    });
});
