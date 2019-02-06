import { arkToArktoshi, arktoshiToArk, parseFee } from "../src/utils";

describe("Utils", () => {
    describe("parseFee", () => {
        it("should give arktoshi", () => {
            expect(parseFee(0.1).toString()).toBe("10000000");
            expect(parseFee(1).toString()).toBe("100000000");
            expect(parseFee(10).toString()).toBe("1000000000");
            expect(parseFee("0.1").toString()).toBe("10000000");
            expect(parseFee("1").toString()).toBe("100000000");
            expect(parseFee("10").toString()).toBe("1000000000");
            expect(parseFee("0.001-0.005").toNumber()).toBeWithin(100000, 500000);
        });
    });

    describe("arkToArktoshi", () => {
        it("should give arktoshi", () => {
            expect(arkToArktoshi(0.00000001).toString()).toBe("1");
            expect(arkToArktoshi(0.1).toString()).toBe("10000000");
            expect(arkToArktoshi(1).toString()).toBe("100000000");
            expect(arkToArktoshi(10).toString()).toBe("1000000000");
        });
    });

    describe("arktoshiToArk", () => {
        it("should give ark", () => {
            expect(arktoshiToArk(1)).toBe("0.00000001 DѦ");
            expect(arktoshiToArk(10000000)).toBe("0.1 DѦ");
            expect(arktoshiToArk(100000000)).toBe("1 DѦ");
            expect(arktoshiToArk(1000000000)).toBe("10 DѦ");
        });
    });
});
