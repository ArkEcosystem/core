import "@packages/core-test-framework/src/matchers/functional/accepted";
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

describe("Accepted", () => {
    describe("toBeAccepted", () => {
        it("should pass", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                return {
                    body: JSON.stringify({
                        errors: undefined,
                        data: {
                            accept: [transactions[0].id],
                            broadcast: [transactions[0].id],
                        },
                    }),
                };
            });

            await expect(transactions[0]).toBeAccepted();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass due thrown error", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                const error = new Error();
                error["response"] = { statusCode: 400 };
                throw error;
            });

            await expect(transactions[0]).not.toBeAccepted();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });

    describe("toBeAllAccepted", () => {
        it("should pass", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                return {
                    body: JSON.stringify({
                        errors: undefined,
                    }),
                };
            });

            await expect(transactions).toBeAllAccepted();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass due thrown error", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                const error = new Error();
                error["response"] = { statusCode: 400 };
                throw error;
            });

            await expect(transactions).not.toBeAllAccepted();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });

    describe("toBeEachAccepted", () => {
        it("should pass", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                return {
                    body: JSON.stringify({
                        errors: undefined,
                    }),
                };
            });

            await expect(transactions).toBeEachAccepted();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass due returned error", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                return {
                    body: JSON.stringify({
                        errors: "Dummy error",
                    }),
                };
            });

            await expect(transactions).not.toBeEachAccepted();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass due thrown error", async () => {
            // @ts-ignore
            let spyOnPost = jest.spyOn(got, "post").mockImplementation((url: any) => {
                const error = new Error();
                error["response"] = { statusCode: 400 };
                throw error;
            });

            await expect(transactions).not.toBeEachAccepted();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });
});
