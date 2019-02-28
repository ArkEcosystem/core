import { readSync } from "clipboardy";
import "jest-extended";

import { copyToClipboard, handleOutput } from "../../../packages/core-debugger-cli/src/utils";

const dummyData = { hello: "world" };

describe("Utils", () => {
    describe("copyToClipboard", () => {
        it("should contain the copied data", () => {
            copyToClipboard(dummyData);

            expect(JSON.parse(readSync())).toEqual(dummyData);
        });
    });

    describe("handleOutput", () => {
        it("should copy the data", () => {
            handleOutput({ copy: true }, dummyData);

            expect(JSON.parse(readSync())).toEqual(dummyData);
        });

        it("should log the data", () => {
            const method = jest.spyOn(global.console, "log");

            handleOutput({ log: true }, dummyData);

            expect(method).toHaveBeenCalledWith(dummyData);
        });

        it("should return the data", () => {
            expect(handleOutput({}, dummyData)).toEqual(dummyData);
        });
    });
});
