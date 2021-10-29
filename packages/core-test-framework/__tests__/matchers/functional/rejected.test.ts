import "@packages/core-test-framework/src/matchers/functional/rejected";
import { Interfaces } from "@packages/crypto";
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

describe("Rejected", () => {
    describe("toBeRejected", () => {
        it("should pass", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                return {
                    body: JSON.stringify({
                        errors: "Dummy error",
                        data: {
                            invalid: [transactions[0].id],
                        },
                    }),
                };
            });

            await expect(transactions[0]).toBeRejected();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should pass due thrown error", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                throw new Error();
            });

            await expect(transactions[0]).toBeRejected();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });

    describe("toBeEachRejected", () => {
        it("should pass", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation(async (url: any, data: any) => {
                let parsedData = JSON.parse(data.body);

                return {
                    body: JSON.stringify({
                        errors: "Dummy error",
                        data: {
                            invalid: parsedData.transactions.map((x) => x.id),
                        },
                    }),
                };
            });

            await expect(transactions).toBeEachRejected();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should pass due response without error", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation(async (url: any, data: any) => {
                let parsedData = JSON.parse(data.body);

                return {
                    body: JSON.stringify({
                        data: {
                            invalid: parsedData.transactions.map((x) => x.id),
                        },
                    }),
                };
            });

            await expect(transactions).not.toBeEachRejected();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should pass due thrown error", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                throw new Error();
            });

            await expect(transactions).toBeEachRejected();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });
});
