import "jest-extended";

import { ChunkCache } from "@packages/core-p2p/src/chunk-cache";
import { Sandbox } from "@packages/core-test-framework";

describe("EventListener", () => {
    let sandbox: Sandbox;
    let chunkCache: ChunkCache;

    beforeEach(() => {
        sandbox = new Sandbox();

        chunkCache = sandbox.app.resolve(ChunkCache);
    });

    describe("set", () => {
        it("should set data", () => {
            chunkCache.set("1-2", []);
        });

        it("should remove first inserted data when cache is full", () => {
            for (let i = 0; i < 100; i++) {
                chunkCache.set(`${i}`, []);
            }

            expect(() => {
                chunkCache.get("0");
            }).not.toThrowError();

            chunkCache.set(`101`, []);

            expect(() => {
                chunkCache.get("0");
            }).toThrowError();
        });
    });

    describe("get", () => {
        it("should get data", () => {
            const chunk = [{ id: "1" }, { id: "2" }];

            // @ts-ignore
            chunkCache.set("1-2", chunk);

            expect(chunkCache.get("1-2")).toBe(chunk);
        });

        it("should throw error if key does not exists", () => {
            expect(() => {
                chunkCache.get("1-2");
            }).toThrowError(`Downloaded chunk for key 1-2 is not defined.`);
        });
    });

    describe("has", () => {
        it("should return true if key exists", () => {
            chunkCache.set("1-2", []);

            expect(chunkCache.has("1-2")).toBe(true);
        });

        it("should return false if key does not exists", () => {
            expect(chunkCache.has("1-2")).toBe(false);
        });
    });

    describe("remove", () => {
        it("should remove by key", () => {
            chunkCache.set("1-2", []);
            expect(chunkCache.has("1-2")).toBe(true);

            chunkCache.remove("1-2");
            expect(chunkCache.has("1-2")).toBe(false);
        });

        it("should pass if key doesnt exists", () => {
            expect(chunkCache.has("1-2")).toBe(false);

            chunkCache.remove("1-2");
        });
    });
});
