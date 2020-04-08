import { Container } from "@arkecosystem/core-kernel";
import { InvalidGeneratorHandler } from "../../../../../packages/core-blockchain/src/processor/handlers/invalid-generator-handler";
import { BlockProcessorResult } from "../../../../../packages/core-blockchain/src/processor";
import { Interfaces } from "@arkecosystem/crypto";

describe("InvalidGeneratorHandler", () => {
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
            const invalidGeneratorHandler = container.resolve<InvalidGeneratorHandler>(InvalidGeneratorHandler);

            const block = {};
            const result = await invalidGeneratorHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Rejected);
            expect(blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
        });
    });
});
