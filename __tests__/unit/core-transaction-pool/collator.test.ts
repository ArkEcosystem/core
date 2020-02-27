import { Container } from "@arkecosystem/core-kernel";
import { Managers } from "@arkecosystem/crypto";

import { Collator } from "../../../packages/core-transaction-pool/src/collator";

jest.mock("@arkecosystem/crypto");

describe("Collator", () => {
    const container = new Container.Container();

    describe("getBlockCandidateTransactions", () => {
        const validator = { validate: jest.fn() };
        const configuration = { get: jest.fn() };
        const createTransactionValidator = jest.fn(() => validator);
        const blockchain = { getLastBlock: jest.fn() };
        const pool = { cleanUp: jest.fn(), removeTransaction: jest.fn() };
        const poolQuery = { getAllFromHighestPriority: jest.fn() };
        const logger = { error: jest.fn() };

        beforeAll(() => {
            container.unbindAll();
            container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
            container
                .bind(Container.Identifiers.TransactionValidatorFactory)
                .toConstantValue(createTransactionValidator);
            container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
            container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(pool);
            container.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue(poolQuery);
            container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        });

        beforeEach(() => {
            validator.validate.mockClear();
            configuration.get.mockClear();
            createTransactionValidator.mockClear();
            blockchain.getLastBlock.mockClear();
            pool.cleanUp.mockClear();
            poolQuery.getAllFromHighestPriority.mockClear();
            logger.error.mockClear();
        });

        it("should respect milestone transaction count limit", async () => {
            const poolTransactions = new Array(10).fill({ data: "12345678" });
            const milestone = { block: { maxTransactions: 5 } };
            const lastBlock = { data: { height: 10 } };

            (Managers.configManager.getMilestone as jest.Mock).mockReturnValueOnce(milestone);
            blockchain.getLastBlock.mockReturnValueOnce(lastBlock);
            poolQuery.getAllFromHighestPriority.mockReturnValueOnce(poolTransactions);

            const collator = container.resolve(Collator);
            const candidateTransaction = await collator.getBlockCandidateTransactions();

            expect(candidateTransaction.length).toBe(5);
            expect(configuration.get).toBeCalled();
            expect(Managers.configManager.getMilestone).toBeCalled();
            expect(createTransactionValidator).toBeCalled();
            expect(pool.cleanUp).toBeCalled();
            expect(validator.validate).toBeCalledTimes(5);
        });

        it("should respect maxTransactionBytes configuration limit", async () => {
            const poolTransactions = new Array(10).fill({ data: "12345678" });
            const milestone = { block: { maxTransactions: 100 } };
            const lastBlock = { data: { height: 10 } };

            (Managers.configManager.getMilestone as jest.Mock).mockReturnValueOnce(milestone);
            configuration.get.mockReturnValueOnce(25);
            blockchain.getLastBlock.mockReturnValueOnce(lastBlock);
            poolQuery.getAllFromHighestPriority.mockReturnValueOnce(poolTransactions);

            const collator = container.resolve(Collator);
            const candidateTransaction = await collator.getBlockCandidateTransactions();

            expect(candidateTransaction.length).toBe(2);
            expect(configuration.get).toBeCalled();
            expect(Managers.configManager.getMilestone).toBeCalled();
            expect(createTransactionValidator).toBeCalled();
            expect(pool.cleanUp).toBeCalled();
            expect(validator.validate).toBeCalledTimes(2);
        });
    });
});
