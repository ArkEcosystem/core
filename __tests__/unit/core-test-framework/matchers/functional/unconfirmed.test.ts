import "@packages/core-test-framework/src/matchers/functional/unconfirmed";

import { Interfaces } from "@arkecosystem/crypto";
import got from "got";

let transactions: Partial<Interfaces.ITransactionData>[];

beforeEach(() => {
    transactions = [
        {
            id: "d7391949e1091176c4b33e6a9b46263b0ee743dce666d32cfec00258958a7199",
        },
        {
            id: "b3c334dba61f797c4e12fdc28be8b9e2d88251e5025ca0b9ea4ea631780c4541",
        },
        {
            id: "8fa3422ec3bf69cf4931b867dfc97185df891c4d45d0c2993014332daa69c596",
        },
    ];
});

describe("Unconfirmed", () => {
    describe("toBeUnconfirmed", () => {
        let spyOnPost;

        beforeAll(() => {
            // @ts-ignore
            spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                return {
                    body: JSON.stringify({
                        errors: "Dummy error",
                        data: transactions,
                    }),
                };
            });
        });

        it("should pass", async () => {
            await expect(transactions[0]).toBeUnconfirmed();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if transaction is not listed in response", async () => {
            await expect({ id: "dummy_id" }).not.toBeUnconfirmed();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass if method throws error", async () => {
            // @ts-ignore
            const spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                throw new Error();
            });

            await expect(transactions[0]).not.toBeUnconfirmed();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });
});
