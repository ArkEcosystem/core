import { Container } from "@packages/core-kernel";
import { TransactionsController } from "@packages/core-p2p/src/socket-server/controllers/transactions";
import { Sandbox } from "@packages/core-test-framework";
import { Managers, Networks } from "@packages/crypto";

Managers.configManager.getMilestone().aip11 = true; // for creating aip11 v2 transactions

describe("TransactionsController", () => {
    let sandbox: Sandbox;
    let transactionsController: TransactionsController;

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const processor = {
        process: jest.fn().mockReturnValue({ accept: [] }),
    };

    beforeEach(() => {
        sandbox = new Sandbox();

        sandbox.app.bind(Container.Identifiers.LogService).toConstantValue(logger);
        sandbox.app.bind(Container.Identifiers.TransactionPoolProcessor).toConstantValue(processor);

        transactionsController = sandbox.app.resolve<TransactionsController>(TransactionsController);
    });

    describe("postTransactions", () => {
        it("should create transaction processor and use it to process the transactions", async () => {
            const transactions = Networks.testnet.genesisBlock.transactions;
            processor.process.mockReturnValueOnce({ accept: [transactions[0].id] });

            expect(await transactionsController.postTransactions({ payload: { transactions } }, {})).toEqual([
                transactions[0].id,
            ]);

            expect(processor.process).toBeCalledTimes(1);
            expect(processor.process).toBeCalledWith(transactions);
        });
    });
});
