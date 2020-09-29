import { Container } from "@arkecosystem/core-kernel";
import { ExceptionHandler } from "@packages/core-blockchain/src/processor/handlers/exception-handler";
import { AcceptBlockHandler } from "@packages/core-blockchain/src/processor/handlers/accept-block-handler";
import { BlockProcessorResult } from "@packages/core-blockchain/src/processor";
import { Interfaces } from "@arkecosystem/crypto";

describe("ExceptionHandler", () => {
    const container = new Container.Container();

    const logger = { warning: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const blockchain = { resetLastDownloadedBlock: jest.fn() };
    const database = { getBlock: jest.fn() };
    const application = { resolve: jest.fn() };

    beforeAll(() => {
        container.unbindAll();
        container.bind(Container.Identifiers.Application).toConstantValue(application);
        container.bind(Container.Identifiers.BlockchainService).toConstantValue(blockchain);
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.DatabaseService).toConstantValue(database);
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe("execute", () => {
        const block = { data: { id: "123", height: 4445 } };

        it("should return Rejected and resetLastDownloadedBlock if block is already forged", async () => {
            const exceptionHandler = container.resolve<ExceptionHandler>(ExceptionHandler);

            database.getBlock = jest.fn().mockResolvedValueOnce(block);
            const result = await exceptionHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Rejected);

            expect(blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
        });

        it("should call AcceptHandler if block is not forged yet", async () => {
            const exceptionHandler = container.resolve<ExceptionHandler>(ExceptionHandler);

            const mockAcceptHandler = {
                execute: () => BlockProcessorResult.Accepted,
            };
            application.resolve = jest.fn().mockReturnValue(mockAcceptHandler);

            const result = await exceptionHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Accepted);

            expect(application.resolve).toBeCalledTimes(1);
            expect(application.resolve).toBeCalledWith(AcceptBlockHandler);
        });
    });
});
