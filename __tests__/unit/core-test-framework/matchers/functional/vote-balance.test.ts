import "@packages/core-test-framework/src/matchers/functional/vote-balance";

import got from "got";

describe("VoteBalance", () => {
    describe("toHaveVoteBalance", () => {
        let spyOnPost;

        beforeAll(() => {
            // @ts-ignore
            spyOnPost = jest.spyOn(got, "get").mockImplementation((url: any) => {
                return {
                    body: JSON.stringify({
                        data: {
                            votes: "10",
                        },
                    }),
                };
            });
        });

        it("should pass", async () => {
            await expect("delegate_public_key").toHaveVoteBalance("10");
            expect(spyOnPost).toHaveBeenCalled();
        });

        it("should not pass due vote balance mismatch", async () => {
            await expect("delegate_public_key").not.toHaveVoteBalance("12");
            expect(spyOnPost).toHaveBeenCalled();
        });
    });
});
