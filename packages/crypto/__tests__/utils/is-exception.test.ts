import "jest-extended";

import { configManager } from "../../src/managers";
import { IBlockData } from "../../src/models";
import { isException } from "../../src/utils";

describe("IsException", () => {
    it("should return true", () => {
        // @ts-ignore
        configManager.get = jest.fn(() => ["1"]);
        expect(isException({ id: "1" } as IBlockData)).toBeTrue();
    });

    it("should return false", () => {
        // @ts-ignore
        configManager.get = jest.fn(() => ["1"]);
        expect(isException({ id: "2" } as IBlockData)).toBeFalse();

        configManager.get = jest.fn(() => undefined);
        expect(isException({ id: "2" } as IBlockData)).toBeFalse();

        configManager.get = jest.fn(() => undefined);
        expect(isException({ id: undefined } as IBlockData)).toBeFalse();
    });
});
