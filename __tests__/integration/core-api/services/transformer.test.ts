import { TransformerService } from "@packages/core-api/src/services/transformer";
import { Managers, Transactions } from "@packages/crypto";
import { setUp, tearDown } from "../__support__/setup";
import blockRaw from "./block-raw.json";
import blockTransformed from "./block-transformed.json";
import transactionRaw from "./transaction-raw.json";
import transactionTransformed from "./transaction-transformed.json";
import { Identities } from "@arkecosystem/crypto";

const filterUndefined = values => {
    if (Array.isArray(values)) {
        for (const value of values) {
            filterUndefined(value);
        }
    }

    for (const key of Object.keys(values)) {
        if (values[key] === undefined) {
            delete values[key];
        }
    }

    return values;
};

let transformerService: TransformerService;
let genesisBlock;
let genesisTransaction;

beforeAll(async () => {
    const app = await setUp();

    transformerService = app.resolve<TransformerService>(TransformerService);

    genesisBlock = Managers.configManager.get("genesisBlock");

    Managers.configManager.getMilestone().aip11 = false;

    genesisTransaction = Transactions.TransactionFactory.fromData(genesisBlock.transactions[0]);

    delete genesisBlock.transactions;
});

afterAll(async () => tearDown());

describe("Transformer", () => {
    describe("toResource", () => {
        it("should transform a block", () => {
            const transformed = { ...blockTransformed };
            transformed.id = genesisBlock.id;
            transformed.generator.address = Identities.Address.fromPublicKey(genesisBlock.generatorPublicKey);
            transformed.generator.publicKey = genesisBlock.generatorPublicKey;
            transformed.payload.hash = genesisBlock.payloadHash;
            transformed.payload.length = genesisBlock.payloadLength;
            transformed.signature = genesisBlock.blockSignature;

            expect(transformerService.toResource(genesisBlock, "block")).toEqual(transformed);
        });

        it("should not transform a block", () => {
            const transformed = { ...blockRaw };
            transformed.id = genesisBlock.id;
            transformed.generatorPublicKey = Identities.Address.fromPublicKey(genesisBlock.generatorPublicKey);
            transformed.generatorPublicKey = genesisBlock.generatorPublicKey;
            transformed.payloadHash = genesisBlock.payloadHash;
            transformed.payloadLength = genesisBlock.payloadLength;
            transformed.blockSignature = genesisBlock.blockSignature;

            expect(transformerService.toResource(genesisBlock, "block", false)).toEqual(transformed);
        });

        it("should transform a transaction", () => {
            const transformed = { ...transactionTransformed };
            transformed.id = genesisTransaction.data.id;
            transformed.sender = Identities.Address.fromPublicKey(genesisTransaction.data.senderPublicKey);
            transformed.senderPublicKey = genesisTransaction.data.senderPublicKey;
            transformed.signature = genesisTransaction.data.signature;

            expect(filterUndefined(transformerService.toResource(genesisTransaction, "transaction"))).toEqual(
                transformed,
            );
        });

        it("should not transform a transaction", () => {
            const transformed = { ...transactionRaw };
            transformed.id = genesisTransaction.data.id;
            transformed.senderPublicKey = genesisTransaction.data.senderPublicKey;
            transformed.signature = genesisTransaction.data.signature;

            expect(transformerService.toResource(genesisTransaction, "transaction", false)).toEqual(transformed);
        });
    });

    describe("toCollection", () => {
        it("should transform a block", () => {
            const transformed = { ...blockTransformed };
            transformed.id = genesisBlock.id;
            transformed.generator.address = Identities.Address.fromPublicKey(genesisBlock.generatorPublicKey);
            transformed.generator.publicKey = genesisBlock.generatorPublicKey;
            transformed.payload.hash = genesisBlock.payloadHash;
            transformed.payload.length = genesisBlock.payloadLength;
            transformed.signature = genesisBlock.blockSignature;

            expect(transformerService.toCollection([genesisBlock], "block")).toEqual([transformed]);
        });

        it("should not transform a block", () => {
            const transformed = { ...blockRaw };
            transformed.id = genesisBlock.id;
            transformed.generatorPublicKey = Identities.Address.fromPublicKey(genesisBlock.generatorPublicKey);
            transformed.generatorPublicKey = genesisBlock.generatorPublicKey;
            transformed.payloadHash = genesisBlock.payloadHash;
            transformed.payloadLength = genesisBlock.payloadLength;
            transformed.blockSignature = genesisBlock.blockSignature;

            expect(transformerService.toCollection([genesisBlock], "block", false)).toEqual([transformed]);
        });

        it("should transform a transaction", () => {
            const transformed = { ...transactionTransformed };
            transformed.id = genesisTransaction.data.id;
            transformed.sender = Identities.Address.fromPublicKey(genesisTransaction.data.senderPublicKey);
            transformed.senderPublicKey = genesisTransaction.data.senderPublicKey;
            transformed.signature = genesisTransaction.data.signature;

            expect(filterUndefined(transformerService.toCollection([genesisTransaction], "transaction"))).toEqual([
                transformed,
            ]);
        });

        it("should not transform a transaction", () => {
            const transformed = { ...transactionRaw };
            transformed.id = genesisTransaction.data.id;
            transformed.senderPublicKey = genesisTransaction.data.senderPublicKey;
            transformed.signature = genesisTransaction.data.signature;

            expect(transformerService.toCollection([genesisTransaction], "transaction", false)).toEqual([transformed]);
        });
    });
});
