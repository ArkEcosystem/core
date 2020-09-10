import "@packages/core-test-framework/src/matchers/functional/forged";
import { Interfaces } from "@packages/crypto";
import got from "got";

let block: Partial<Interfaces.IBlockData>;

beforeEach(() => {
    block = {
        id: "67219440c617ddaa7b7d102df462773c5b765ca1a1ba0827340f34ff32f495ef",
    };
});

describe("Forged", () => {
    describe("toBeForged", () => {
        it("should pass", async () => {
            // @ts-ignore
            const spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                return {
                    body: JSON.stringify({
                        data: {
                            id: block.id,
                        },
                    }),
                };
            });

            await expect(block.id).toBeForged();
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass due thrown error", async () => {
            // @ts-ignore
            const spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                throw new Error();
            });

            await expect(block.id).not.toBeForged();
            expect(spyOnPost).toHaveBeenCalled();
        });
    });
});
