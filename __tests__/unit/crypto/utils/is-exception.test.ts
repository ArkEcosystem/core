import "jest-extended";

import { configManager } from "../../../../packages/crypto/src/managers";
import { isException } from "../../../../packages/crypto/src/utils";

describe("IsException", () => {
    it("should return true", () => {
        // @ts-ignore
        configManager.get = jest.fn(() => ["1"]);
        expect(isException("1")).toBeTrue();
    });

    it("should return false", () => {
        // @ts-ignore
        configManager.get = jest.fn(() => ["1"]);
        expect(isException("2")).toBeFalse();

        configManager.get = jest.fn(() => undefined);
        expect(isException("2")).toBeFalse();

        configManager.get = jest.fn(() => undefined);
        expect(isException(undefined)).toBeFalse();
    });
});
