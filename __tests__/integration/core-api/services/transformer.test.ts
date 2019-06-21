import { transformerService } from "../../../../packages/core-api/src/services/transformer";
import { Managers, Transactions } from "../../../../packages/crypto/src";
import { genesisBlock } from "../../../utils/config/testnet/genesisBlock";
import { setUp, tearDown } from "../__support__/setup";
import blockRaw from "./block-raw.json";
import blockTransformed from "./block-transformed.json";
import transactionRaw from "./transaction-raw.json";
import transactionTransformed from "./transaction-transformed.json";

Managers.configManager.setFromPreset("testnet");

const genesisTransaction = Transactions.TransactionFactory.fromData(genesisBlock.transactions[0]);
delete genesisBlock.transactions;

beforeAll(async () => setUp());
afterAll(async () => tearDown());

describe("Transformer", () => {
    describe("toResource", () => {
        it("should transform a block", () => {
            expect(transformerService.toResource(genesisBlock, "block")).toEqual(blockTransformed);
        });

        it("should not transform a block", () => {
            expect(transformerService.toResource(genesisBlock, "block", false)).toEqual(blockRaw);
        });

        it("should transform a transaction", () => {
            expect(transformerService.toResource(genesisTransaction, "transaction")).toEqual(transactionTransformed);
        });

        it("should not transform a transaction", () => {
            expect(transformerService.toResource(genesisTransaction, "transaction", false)).toEqual(transactionRaw);
        });
    });

    describe("toCollection", () => {
        it("should transform a block", () => {
            expect(transformerService.toCollection([genesisBlock], "block")).toEqual([blockTransformed]);
        });

        it("should not transform a block", () => {
            expect(transformerService.toCollection([genesisBlock], "block", false)).toEqual([blockRaw]);
        });

        it("should transform a transaction", () => {
            expect(transformerService.toCollection([genesisTransaction], "transaction")).toEqual([
                transactionTransformed,
            ]);
        });

        it("should not transform a transaction", () => {
            expect(transformerService.toCollection([genesisTransaction], "transaction", false)).toEqual([
                transactionRaw,
            ]);
        });
    });
});
