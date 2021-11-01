import "jest-extended";

import { RestClient } from "@packages/core-test-framework/src/utils/rest-client";
import { Utils } from "@packages/core-kernel";

let spyOnGet: jest.SpyInstance;
let spyOnPost: jest.SpyInstance;

beforeEach(() => {
    // @ts-ignore
    spyOnGet = jest.spyOn(Utils.http, "get").mockImplementation((url: string, opts?: any) => {
        return {};
    });

    // @ts-ignore
    spyOnPost = jest.spyOn(Utils.http, "post").mockImplementation((url: string, opts?: any) => {
        return {};
    });
});

afterEach(() => {
    jest.resetAllMocks();
});

describe("RestClient", () => {
    describe("get", () => {
        it("should resolve", async () => {
            let opts = {
                body: {
                    test: "test",
                },
            };

            await expect(RestClient.get("blockchain", opts)).resolves.toEqual({});
            expect(spyOnGet).toHaveBeenCalled();
        });
    });

    describe("post", () => {
        it("should resolve", async () => {
            let opts = {
                test: "test",
            };

            await expect(RestClient.post("blockchain", opts)).resolves.toEqual({});
            expect(spyOnPost).toHaveBeenCalled();
        });
    });

    describe("broadcast", () => {
        it("should resolve", async () => {
            await expect(RestClient.broadcast([])).resolves.toEqual({});
            expect(spyOnPost).toHaveBeenCalled();
        });
    });
});
