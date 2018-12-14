import "jest-extended";

import { transactionBuilder } from "../../src/builder";

describe("Builder", () => {
    it("should be instantiated", () => {
        expect(transactionBuilder).toBeObject();
    });
});
