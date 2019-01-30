import { app } from "@arkecosystem/core-kernel";
import { models } from "@arkecosystem/crypto";
import genesisBlock from "../../core-test-utils/src/config/testnet/genesisBlock.json";
import { PostgresConnection } from "../src/connection";
import { setUp, tearDown } from "./__support__/setup";

const { Block } = models;

let connection;

beforeAll(async () => {
    await setUp();
    connection = app.resolve<PostgresConnection>("database");
});

afterAll(async () => {
    await tearDown();
});

describe("Connection", () => {
    describe("verifyBlockchain", () => {
        it("should be valid - no errors - when verifying blockchain", async () => {
            expect(await connection.verifyBlockchain()).toEqual({
                valid: true,
                errors: [],
            });
        });
    });

    describe("getLastBlock", () => {
        it("should get the genesis block as last block", async () => {
            const lastBlock = await connection.getLastBlock();

            expect(lastBlock).toEqual(new Block(genesisBlock));
        });
    });
});
