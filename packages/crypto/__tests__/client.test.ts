import "jest-extended";
import { client, Client } from "../dist/client";

describe("Client", () => {
    it("should be instantiated", () => {
        expect(client).toBeInstanceOf(Client);
    });
});
