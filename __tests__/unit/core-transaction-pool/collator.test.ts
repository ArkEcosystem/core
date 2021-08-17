import { Container } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";

import { Collator } from "../../../packages/core-transaction-pool/src/collator";

jest.mock("@arkecosystem/crypto");

const validator = { validate: jest.fn() };
const createTransactionValidator = jest.fn();
const blockchain = { getLastBlock: jest.fn() };
const pool = { removeTransaction: jest.fn() };
const expirationService = { isExpired: jest.fn() };
const poolQuery = { getFromHighestPriority: jest.fn() };
const logger = { warning: jest.fn(), error: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.TransactionValidatorFactory).toConstantValue(createTransactionValidator);
container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(pool);
container.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue(poolQuery);
container.bind(Container.Identifiers.TransactionPoolExpirationService).toConstantValue(expirationService);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);

beforeEach(() => {
    jest.resetAllMocks();
    createTransactionValidator.mockReturnValue(validator);
});

describe("Collator.getBlockCandidateTransactions", () => {
    it("should respect block.maxTransactions milestone limit", async () => {
        const poolTransactions = [
            { data: { senderPublicKey: "0" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "1" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "2" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "3" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "4" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "5" }, serialized: Buffer.alloc(10) },
        ];

        const milestone = { block: { idFullSha256: true, maxTransactions: 5, maxPayload: 2097152 } };
        const lastBlock = { data: { height: 10 } };

        (Managers.configManager.getMilestone as jest.Mock).mockReturnValueOnce(milestone);
        blockchain.getLastBlock.mockReturnValueOnce(lastBlock);
        poolQuery.getFromHighestPriority.mockReturnValueOnce(poolTransactions);
        expirationService.isExpired.mockResolvedValue(false);

        const collator = container.resolve(Collator);
        const candidateTransaction = await collator.getBlockCandidateTransactions();

        expect(candidateTransaction.length).toBe(5);
        expect(Managers.configManager.getMilestone).toBeCalled();
        expect(createTransactionValidator).toBeCalled();
        expect(validator.validate).toBeCalledTimes(5);
    });

    it("should respect block.maxPayload milestone limit", async () => {
        const poolTransactions = [
            { data: { senderPublicKey: "0" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "1" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "2" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "3" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "4" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "5" }, serialized: Buffer.alloc(10) },
        ];

        const milestone = { block: { idFullSha256: true, maxTransactions: 5, maxPayload: 141 + 10 + 4 + 10 + 4 } };
        const lastBlock = { data: { height: 10 } };

        (Managers.configManager.getMilestone as jest.Mock).mockReturnValueOnce(milestone);
        blockchain.getLastBlock.mockReturnValueOnce(lastBlock);
        poolQuery.getFromHighestPriority.mockReturnValueOnce(poolTransactions);
        expirationService.isExpired.mockResolvedValue(false);

        const collator = container.resolve(Collator);
        const candidateTransaction = await collator.getBlockCandidateTransactions();

        expect(candidateTransaction.length).toBe(2);
        expect(Managers.configManager.getMilestone).toBeCalled();
        expect(createTransactionValidator).toBeCalled();
        expect(validator.validate).toBeCalledTimes(2);
    });

    it("should ignore future sender transactions if one of them expired", async () => {
        const poolTransactions = [
            { data: { senderPublicKey: "0" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "0" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "2" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "3" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "4" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "5" }, serialized: Buffer.alloc(10) },
        ];

        const milestone = { block: { idFullSha256: true, maxTransactions: 5, maxPayload: 2097152 } };
        const lastBlock = { data: { height: 10 } };

        (Managers.configManager.getMilestone as jest.Mock).mockReturnValueOnce(milestone);
        blockchain.getLastBlock.mockReturnValueOnce(lastBlock);
        poolQuery.getFromHighestPriority.mockReturnValueOnce(poolTransactions);
        expirationService.isExpired.mockResolvedValue(false);
        expirationService.isExpired.mockResolvedValueOnce(true);

        const collator = container.resolve(Collator);
        const candidateTransaction = await collator.getBlockCandidateTransactions();

        expect(candidateTransaction.length).toBe(4);
        expect(Managers.configManager.getMilestone).toBeCalled();
        expect(createTransactionValidator).toBeCalled();
        expect(validator.validate).toBeCalledTimes(4);
        expect(logger.warning).toBeCalledTimes(1);
    });

    it("should ignore future sender transactions if one of them failed", async () => {
        const poolTransactions = [
            { data: { senderPublicKey: "0" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "0" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "2" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "3" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "4" }, serialized: Buffer.alloc(10) },
            { data: { senderPublicKey: "5" }, serialized: Buffer.alloc(10) },
        ];

        const milestone = { block: { idFullSha256: true, maxTransactions: 5, maxPayload: 2097152 } };
        const lastBlock = { data: { height: 10 } };

        (Managers.configManager.getMilestone as jest.Mock).mockReturnValueOnce(milestone);
        blockchain.getLastBlock.mockReturnValueOnce(lastBlock);
        poolQuery.getFromHighestPriority.mockReturnValueOnce(poolTransactions);
        expirationService.isExpired.mockResolvedValue(false);
        validator.validate.mockRejectedValueOnce(new Error("Some error"));

        const collator = container.resolve(Collator);
        const candidateTransaction = await collator.getBlockCandidateTransactions();

        expect(candidateTransaction.length).toBe(4);
        expect(Managers.configManager.getMilestone).toBeCalled();
        expect(createTransactionValidator).toBeCalled();
        expect(validator.validate).toBeCalledTimes(5);
        expect(logger.warning).toBeCalledTimes(1);
    });
});
