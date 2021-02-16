import "jest-extended";

import { MessagePackCodec } from "@packages/core-snapshots/src/codecs";
import { decamelize } from "xcase";

import { Assets } from "../__fixtures__";

const appendPrefix = (prefix: string, entity: any) => {
    const itemToReturn = {};

    const item = entity;

    for (const key of Object.keys(item)) {
        itemToReturn[prefix + decamelize(key)] = item[key];
    }

    return itemToReturn;
};

let codec;

beforeEach(() => {
    codec = new MessagePackCodec();
});

describe("Codec", () => {
    describe("encodeBlock", () => {
        it("should be ok", async () => {
            const encoded = codec.encodeBlock(appendPrefix("Block_", Assets.blocks[1]));

            expect(encoded).toBeDefined();
        });

        it("should throw error", async () => {
            const corruptedBlock = {
                Block_id: "123",
            };

            expect(() => {
                codec.encodeBlock(corruptedBlock);
            }).toThrow();
        });
    });

    describe("decodeBlock", () => {
        it("should be ok", async () => {
            const encoded = codec.encodeBlock(appendPrefix("Block_", Assets.blocks[1]));

            expect(encoded).toBeDefined();

            const decoded = codec.decodeBlock(encoded);

            expect(decoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {
                codec.decodeBlock(Buffer.from(""));
            }).toThrow();
        });
    });

    describe("encodeTransaction", () => {
        it("should be ok", async () => {
            const encoded = codec.encodeTransaction(Assets.transactions[0]);

            expect(encoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {
                codec.encodeTransaction(undefined);
            }).toThrow();
        });
    });

    describe("decodeTransaction", () => {
        it("should be ok", async () => {
            const encoded = codec.encodeTransaction(appendPrefix("Transaction_", Assets.transactions[0]));

            expect(encoded).toBeDefined();

            const decoded = codec.decodeTransaction(encoded);

            expect(decoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {
                codec.decodeTransaction(Buffer.from(""));
            }).toThrow();
        });
    });

    describe("encodeRound", () => {
        it("should be ok", async () => {
            const encoded = codec.encodeRound(appendPrefix("Round_", Assets.rounds[0]));

            expect(encoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {
                codec.encodeRound(undefined);
            }).toThrow();
        });
    });

    describe("decodeRound", () => {
        it("should be ok", async () => {
            const encoded = codec.encodeRound(appendPrefix("Round_", Assets.rounds[0]));

            expect(encoded).toBeDefined();

            const decoded = codec.decodeRound(encoded);

            expect(decoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {
                codec.decodeRound(Buffer.from(""));
            }).toThrow();
        });
    });
});
