import { Container } from "@arkecosystem/core-kernel";
import { IncompatibleTransactionsHandler } from "../../../../../packages/core-blockchain/src/processor/handlers/incompatible-transactions-handler";
import { BlockProcessorResult } from "../../../../../packages/core-blockchain/src/processor";
import { Interfaces } from "@arkecosystem/crypto";

describe("IncompatibleTransactionsHandler", () => {
    const container = new Container.Container();

    const blockchain = { resetLastDownloadedBlock: jest.fn() };

    const application = { get: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("execute", () => {
        it("should call blockchain.resetLastDownloadedBlock and return DiscardedButCanBeBroadcasted", async () => {
            const incompatibleTransactionsHandler = container.resolve<IncompatibleTransactionsHandler>(
                IncompatibleTransactionsHandler,
            );

            const block = {};
            const result = await incompatibleTransactionsHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Rejected);
            expect(blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
        });
    });
});
