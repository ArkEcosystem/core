import { CryptoSuite } from "@packages/core-crypto";
import { Container } from "@packages/core-kernel";
import { Collator } from "@packages/core-transaction-pool/src/collator";

const validator = { validate: jest.fn() };
const configuration = { get: jest.fn() };
const createTransactionValidator = jest.fn();
const blockchain = { getLastBlock: jest.fn() };
const pool = { cleanUp: jest.fn(), removeTransaction: jest.fn() };
const poolQuery = { getFromHighestPriority: jest.fn() };
const logger = { warning: jest.fn(), error: jest.fn() };

const container = new Container.Container();
container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
container.bind(Container.Identifiers.TransactionValidatorFactory).toConstantValue(createTransactionValidator);
container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
container.bind(Container.Identifiers.TransactionPoolService).toConstantValue(pool);
container.bind(Container.Identifiers.TransactionPoolQuery).toConstantValue(poolQuery);
container.bind(Container.Identifiers.LogService).toConstantValue(logger);

const crypto = new CryptoSuite.CryptoSuite(CryptoSuite.CryptoManager.findNetworkByName("testnet"));
crypto.CryptoManager.HeightTracker.setHeight(2);

container.bind(Container.Identifiers.CryptoManager).toConstantValue(crypto.CryptoManager);
container.bind(Container.Identifiers.TransactionManager).toConstantValue(crypto.TransactionManager);
container.bind(Container.Identifiers.BlockFactory).toConstantValue(crypto.BlockFactory);

beforeEach(() => {
    validator.validate.mockReset();
    configuration.get.mockReset();
    createTransactionValidator.mockReset();
    blockchain.getLastBlock.mockReset();
    pool.cleanUp.mockReset();
    poolQuery.getFromHighestPriority.mockReset();
    logger.error.mockReset();

    createTransactionValidator.mockReturnValue(validator);
});

describe("Collator.getBlockCandidateTransactions", () => {
    it("should respect milestone transaction count limit", async () => {
        const poolTransactions = new Array(10).fill({ data: "12345678" });
        const milestone = { block: { maxTransactions: 5 } };
        const lastBlock = { data: { height: 10 } };

        crypto.CryptoManager.MilestoneManager.getMilestone = () => milestone;

        const getMilestoneSpy = jest.spyOn(crypto.CryptoManager.MilestoneManager, "getMilestone");
        blockchain.getLastBlock.mockReturnValueOnce(lastBlock);
        poolQuery.getFromHighestPriority.mockReturnValueOnce(poolTransactions);

        const collator = container.resolve(Collator);
        const candidateTransaction = await collator.getBlockCandidateTransactions();

        expect(candidateTransaction.length).toBe(5);
        expect(configuration.get).toBeCalled();
        expect(getMilestoneSpy).toBeCalled();
        expect(createTransactionValidator).toBeCalled();
        expect(pool.cleanUp).toBeCalled();
        expect(validator.validate).toBeCalledTimes(5);
        getMilestoneSpy.mockRestore();
    });

    it("should respect maxTransactionBytes configuration limit", async () => {
        const poolTransactions = new Array(10).fill({ data: "12345678" });
        const milestone = { block: { maxTransactions: 100 } };
        const lastBlock = { data: { height: 10 } };

        crypto.CryptoManager.MilestoneManager.getMilestone = () => milestone;
        const getMilestoneSpy = jest.spyOn(crypto.CryptoManager.MilestoneManager, "getMilestone");

        configuration.get.mockReturnValueOnce(25);
        blockchain.getLastBlock.mockReturnValueOnce(lastBlock);
        poolQuery.getFromHighestPriority.mockReturnValueOnce(poolTransactions);

        const collator = container.resolve(Collator);
        const candidateTransaction = await collator.getBlockCandidateTransactions();

        expect(candidateTransaction.length).toBe(2);
        expect(configuration.get).toBeCalled();
        expect(getMilestoneSpy).toBeCalled();
        expect(createTransactionValidator).toBeCalled();
        expect(pool.cleanUp).toBeCalled();
        expect(validator.validate).toBeCalledTimes(2);

        getMilestoneSpy.mockRestore();
    });

    it("should remove invalid transaction from pool", async () => {
        const poolTransactions = new Array(5).fill({ data: "12345678" });
        const milestone = { block: { maxTransactions: 5 } };
        const lastBlock = { data: { height: 10 } };
        crypto.CryptoManager.MilestoneManager.getMilestone = () => milestone;
        const getMilestoneSpy = jest.spyOn(crypto.CryptoManager.MilestoneManager, "getMilestone");

        blockchain.getLastBlock.mockReturnValueOnce(lastBlock);
        poolQuery.getFromHighestPriority.mockReturnValueOnce(poolTransactions);
        validator.validate.mockRejectedValueOnce(new Error("Some error"));

        const collator = container.resolve(Collator);
        const candidateTransaction = await collator.getBlockCandidateTransactions();

        expect(candidateTransaction.length).toBe(4);
        expect(configuration.get).toBeCalled();
        expect(getMilestoneSpy).toBeCalled();
        expect(createTransactionValidator).toBeCalled();
        expect(pool.cleanUp).toBeCalled();
        expect(validator.validate).toBeCalledTimes(5);
        expect(logger.warning).toBeCalledTimes(1);
        expect(pool.removeTransaction).toBeCalledTimes(1);
        getMilestoneSpy.mockRestore();
    });
});
