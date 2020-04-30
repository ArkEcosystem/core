import "jest-extended";
import {decamelize} from "xcase";

import { Codec } from "@packages/core-snapshots/src/codecs";
import { Assets } from "../__fixtures__";

const appendPrefix = (prefix: string, entity: any) => {
    let itemToReturn = {};

    let item = entity;

    for(let key of Object.keys(item)) {
        itemToReturn[prefix + decamelize(key)] = item[key];
    }

    return itemToReturn;
}

let codec;

beforeEach(() => {
    codec = new Codec();
})

describe("Codec", () => {
    describe("blocksEncode", () => {
        it("should be ok", async () => {
            let encoded = codec.blocksEncode(appendPrefix("Block_", Assets.blocks[1]));

            expect(encoded).toBeDefined();
        });

        it("should throw error", async () => {
            let corruptedBlock = {
                Block_id: "123"
            }

            expect(() => {codec.blocksEncode(corruptedBlock)}).toThrow();
        });
    })

    describe("blocksDecode", () => {
        it("should be ok", async () => {
            let encoded = codec.blocksEncode(appendPrefix("Block_", Assets.blocks[1]));

            expect(encoded).toBeDefined();

            let decoded = codec.blocksDecode(encoded);

            expect(decoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {codec.blocksDecode(Buffer.from(""))}).toThrow();
        });
    })

    describe("transactionsEncode", () => {
        it("should be ok", async () => {
            let encoded = codec.transactionsEncode(Assets.transactions[0]);

            expect(encoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {codec.transactionsEncode(undefined)}).toThrow();
        });
    })

    describe("transactionsDecode", () => {
        it("should be ok", async () => {
            let encoded = codec.transactionsEncode(appendPrefix("Transaction_", Assets.transactions[0]));

            expect(encoded).toBeDefined();

            let decoded = codec.transactionsDecode(encoded);

            expect(decoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {codec.transactionsDecode(Buffer.from(""))}).toThrow();
        });
    })

    describe("roundsEncode", () => {
        it("should be ok", async () => {
            let encoded = codec.roundsEncode(appendPrefix("Round_", Assets.rounds[0]));

            expect(encoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {codec.roundsEncode(undefined)}).toThrow();
        });
    })

    describe("roundsDecode", () => {
        it("should be ok", async () => {
            let encoded = codec.roundsEncode(appendPrefix("Round_", Assets.rounds[0]));

            expect(encoded).toBeDefined();

            let decoded = codec.roundsDecode(encoded);

            expect(decoded).toBeDefined();
        });

        it("should throw error", async () => {
            expect(() => {codec.roundsDecode(Buffer.from(""))}).toThrow();
        });
    })
});
