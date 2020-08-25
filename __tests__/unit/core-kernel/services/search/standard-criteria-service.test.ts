import { Container, Contracts } from "@arkecosystem/core-kernel";
import { StandardCriteriaService } from "@arkecosystem/core-kernel/src/services/search/standard-criteria-service";
import { Utils } from "@arkecosystem/crypto";

const container = new Container.Container();

const check = <T>(value: T, ...criterias: Contracts.Search.StandardCriteriaOf<T>[]): boolean => {
    return container.resolve(StandardCriteriaService).testStandardCriterias(value, ...criterias);
};

describe("StandardCriteriaService.testStandardCriterias", () => {
    it("should match every criteria argument", () => {
        expect(check(2, 2, "2")).toBe(true);
        expect(check(2, { from: 1 }, { to: 3 })).toBe(true);

        expect(check(2, 2, 3)).toBe(false);
        expect(check(2, { from: 1 }, { to: 1 })).toBe(false);
    });

    it("should match some criteria array item", () => {
        expect(check(2, [2, 3])).toBe(true);
        expect(check(2, [{ from: 1 }, { to: 1 }])).toBe(true);

        expect(check(2, [1, 3])).toBe(false);
        expect(check(2, [{ from: 3 }, { to: 1 }])).toBe(false);
    });

    describe("when value is boolean", () => {
        it("should check boolean criteria", () => {
            expect(check(true, true)).toBe(true);
            expect(check(false, false)).toBe(true);

            expect(check(true, false)).toBe(false);
            expect(check(false, true)).toBe(false);
        });

        it("should check boolean literal criteria", () => {
            expect(check(true, "true")).toBe(true);
            expect(check(false, "false")).toBe(true);

            expect(check(true, "false")).toBe(false);
            expect(check(false, "true")).toBe(false);
        });

        it("should throw when criteria is invalid", () => {
            expect(() => check(true, "NONSENSE")).toThrow("Invalid criteria 'NONSENSE' (string) for boolean value");
        });
    });

    describe("when value is string", () => {
        it("should check string criteria", () => {
            expect(check("John Doe", "John Doe")).toBe(true);

            expect(check("John Doe", "John")).toBe(false);
            expect(check("John Doe", "Doe")).toBe(false);
        });

        it("should check string pattern criteria", () => {
            expect(check("John Doe", "John %")).toBe(true);
            expect(check("John Doe", "John %oe")).toBe(true);
            expect(check("John Doe", "% Doe")).toBe(true);
            expect(check("John Doe", "%")).toBe(true);
            expect(check("John Doe", "J% D%")).toBe(true);

            expect(check("John Doe", "% doe")).toBe(false);
            expect(check("John Doe", "K% D%")).toBe(false);
        });

        it("should throw when criteria is invalid", () => {
            expect(() => check("John Doe", 1 as any)).toThrow("Invalid criteria '1' (number) for string value");
        });
    });

    describe("when value is number", () => {
        it("should check exact number criteria", () => {
            expect(check(1, 1)).toBe(true);
            expect(check(1.1, 1.1)).toBe(true);

            expect(check(1, 2)).toBe(false);
            expect(check(1.1, 1.2)).toBe(false);
        });

        it("should check exact string criteria", () => {
            expect(check(1, "1")).toBe(true);
            expect(check(1.1, "1.1")).toBe(true);

            expect(check(1, "2")).toBe(false);
            expect(check(1.1, "1.2")).toBe(false);
        });

        it("should throw when criteria is invalid", () => {
            expect(() => check(1, "not a number")).toThrow("Invalid criteria 'not a number' (string) for number value");
            expect(() => check(1, NaN)).toThrow("Invalid criteria 'NaN' (number) for number value");
            expect(() => check(1, {} as any)).toThrow("Invalid criteria '[object Object]' (Object) for number value");
            expect(() => check(1, null as any)).toThrow("Invalid criteria 'null' for number value");
        });

        it("should check range number criteria", () => {
            expect(check(1, { from: 1 })).toBe(true);
            expect(check(1, { from: 0 })).toBe(true);
            expect(check(1, { to: 1 })).toBe(true);
            expect(check(1, { to: 2 })).toBe(true);
            expect(check(1, { from: 1, to: 1 })).toBe(true);
            expect(check(1, { from: 0, to: 2 })).toBe(true);

            expect(check(1, { from: 2 })).toBe(false);
            expect(check(1, { to: 0 })).toBe(false);
            expect(check(1, { from: 2, to: 3 })).toBe(false);
            expect(check(1, { from: -1, to: 0 })).toBe(false);
        });

        it("should check range string criteria", () => {
            expect(check(1, { from: "1" })).toBe(true);
            expect(check(1, { from: "0" })).toBe(true);
            expect(check(1, { to: "1" })).toBe(true);
            expect(check(1, { to: "2" })).toBe(true);
            expect(check(1, { from: "1", to: 1 })).toBe(true);
            expect(check(1, { from: 0, to: "2" })).toBe(true);

            expect(check(1, { from: "2" })).toBe(false);
            expect(check(1, { to: "0" })).toBe(false);
            expect(check(1, { from: "2", to: 3 })).toBe(false);
            expect(check(1, { from: -1, to: "0" })).toBe(false);
        });

        it("should throw when range criteria is invalid", () => {
            expect(() => check(1, { from: "a" })).toThrow("Invalid criteria 'a' (string) at 'from' for number value");
            expect(() => check(1, { to: "b" })).toThrow("Invalid criteria 'b' (string) at 'to' for number value");
        });
    });

    describe("when value is BigInt | Utils.BigNumber", () => {
        it("should check exact number criteria", () => {
            expect(check(BigInt(1), 1)).toBe(true);
            expect(check(Utils.BigNumber.make(1), 1)).toBe(true);

            expect(check(BigInt(1), 2)).toBe(false);
            expect(check(Utils.BigNumber.make(1), 2)).toBe(false);
        });

        it("should check exact BigInt criteria", () => {
            expect(check(BigInt(1), BigInt(1))).toBe(true);
            expect(check(Utils.BigNumber.make(1), BigInt(1))).toBe(true);

            expect(check(BigInt(1), BigInt(2))).toBe(false);
            expect(check(Utils.BigNumber.make(1), BigInt(2))).toBe(false);
        });

        it("should check exact Utils.BigNumber criteria", () => {
            expect(check(BigInt(1), Utils.BigNumber.make(1))).toBe(true);
            expect(check(Utils.BigNumber.make(1), Utils.BigNumber.make(1))).toBe(true);

            expect(check(BigInt(1), Utils.BigNumber.make(2))).toBe(false);
            expect(check(Utils.BigNumber.make(1), Utils.BigNumber.make(2))).toBe(false);
        });

        it("should check exact string criteria", () => {
            expect(check(BigInt(1), "1")).toBe(true);
            expect(check(Utils.BigNumber.make(1), "1")).toBe(true);

            expect(check(BigInt(1), "2")).toBe(false);
            expect(check(Utils.BigNumber.make(1), "2")).toBe(false);
        });

        it("should throw when criteria is invalid", () => {
            expect(() => check(BigInt(1), "1.1")).toThrow("Invalid criteria '1.1' (string) for bigint value");
            expect(() => check(BigInt(1), "a")).toThrow("Invalid criteria 'a' (string) for bigint value");
            expect(() => check(BigInt(1), NaN)).toThrow("Invalid criteria 'NaN' (number) for bigint value");
            expect(() => check(BigInt(1), {} as any)).toThrow(
                "Invalid criteria '[object Object]' (Object) for bigint value",
            );
            expect(() => check(BigInt(1), null as any)).toThrow("Invalid criteria 'null' for bigint value");

            expect(() => check(BigInt(1), "1.1")).toThrow("Invalid criteria '1.1' (string) for bigint value");
            expect(() => check(BigInt(1), "a")).toThrow("Invalid criteria 'a' (string) for bigint value");
            expect(() => check(BigInt(1), NaN)).toThrow("Invalid criteria 'NaN' (number) for bigint value");
            expect(() => check(BigInt(1), {} as any)).toThrow(
                "Invalid criteria '[object Object]' (Object) for bigint value",
            );
            expect(() => check(BigInt(1), null as any)).toThrow("Invalid criteria 'null' for bigint value");
        });
    });

    it("should not match non-existing property", () => {
        const value = { name: "John Doe" };
        const criteria = { country: "US" };
        const result = check(value, criteria as any);

        expect(result).toBe(false);
    });

    it("should filter out deeply nested range criteria", () => {
        const value = {
            attributes: { rank: 5 },
        };

        const criteria = {
            attributes: {
                rank: [
                    { from: 1, to: 2 },
                    { from: 10, to: 12 },
                ],
            },
        };

        const result = check(value, criteria);

        expect(result).toBe(false);
    });
});
