import { flagsToStrings } from "@packages/core/src/common/flags";

describe("flagsToStrings", () => {
    it("should handle strings", () => {
        expect(
            flagsToStrings({
                key: "value",
            }),
        ).toEqual("--key=value");
    });

    it("should handle strings with spaces", () => {
        expect(
            flagsToStrings({
                key: "hello world",
            }),
        ).toEqual('--key="hello world"');
    });

    it("should handle integers", () => {
        expect(
            flagsToStrings({
                key: 1,
            }),
        ).toEqual("--key=1");
    });

    it("should handle booleans", () => {
        expect(
            flagsToStrings({
                key: true,
            }),
        ).toEqual("--key");
    });

    it("should ignore keys", () => {
        expect(
            flagsToStrings(
                {
                    key: "value",
                    ignore: "value",
                },
                ["ignore"],
            ),
        ).toEqual("--key=value");
    });
});
