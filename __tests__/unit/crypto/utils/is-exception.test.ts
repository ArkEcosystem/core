import { IBlockData } from "../../../../packages/crypto/src/interfaces";
import { configManager } from "../../../../packages/crypto/src/managers";
import { isException } from "../../../../packages/crypto/src/utils";

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
