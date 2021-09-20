import { castFlagsToString } from "@packages/core-cli/src/utils/flags";

describe("castFlagsToString", () => {
    it("should handle strings", () => {
        expect(
            castFlagsToString({
                key: "value",
            }),
        ).toEqual("--key='value'");
    });

    it("should handle strings with spaces", () => {
        expect(
            castFlagsToString({
                key: "hello world",
            }),
        ).toEqual("--key='hello world'");
    });

    it("should handle integers", () => {
        expect(
            castFlagsToString({
                key: 1,
            }),
        ).toEqual("--key=1");
    });

    it("should handle booleans", () => {
        expect(
            castFlagsToString({
                key: true,
            }),
        ).toEqual("--key");
    });

    it("should ignore keys", () => {
        expect(
            castFlagsToString(
                {
                    key: "value",
                    ignore: "value",
                },
                ["ignore"],
            ),
        ).toEqual("--key='value'");
    });
});
