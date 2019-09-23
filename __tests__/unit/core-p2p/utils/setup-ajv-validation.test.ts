import { Validation } from "@arkecosystem/crypto";
import { setupAjvPeerValidation } from "../../../../packages/core-p2p/src/utils/setup-ajv-peer-validation";

describe("setupAjvPeerValidation", () => {
    it("should be ok", () => {
        setupAjvPeerValidation(Validation.validator);

        const ajv = Validation.validator.getInstance();
        const validate = ajv.compile({
            type: "string",
            format: "peer",
        });

        expect(validate("5.196.105.32")).toBeTrue();
        expect(validate("127.0.0.1")).toBeFalse();
        expect(validate("::1")).toBeFalse();
        expect(validate("garbage")).toBeFalse();
    });
});
