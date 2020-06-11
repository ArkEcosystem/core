import { CryptoSuite } from "@packages/core-crypto";
import { SocketErrors } from "@packages/core-p2p/src/enums";
import { validate } from "@packages/core-p2p/src/socket-server/utils/validate";

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));

describe("validate", () => {
    it("should validate using crypto validate()", () => {
        const spyValidate = jest.spyOn(crypto.Validator, "validate");

        const schema = { type: "object", maxProperties: 0 };
        const data = {};
        validate(schema, data, crypto.Validator);

        expect(spyValidate).toBeCalledWith(schema, data);
    });

    it("should throw if crypto validate() returns errors", () => {
        const spyValidate = jest.spyOn(crypto.Validator, "validate");

        const schema = { type: "object", maxProperties: 0 };
        const data = { oneProp: "1" };
        const expectedError = new Error("Data validation error : data should NOT have more than 0 properties");
        expectedError.name = SocketErrors.Validation;

        expect(() => validate(schema, data, crypto.Validator)).toThrow(expectedError);

        expect(spyValidate).toBeCalledWith(schema, data);
    });
});
