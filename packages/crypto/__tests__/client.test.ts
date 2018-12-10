import "jest-extended";
import { client } from "../src/client";

describe("Client", () => {
    it("should be instantiated", () => {
        expect(client).toBeObject();
    });
});
