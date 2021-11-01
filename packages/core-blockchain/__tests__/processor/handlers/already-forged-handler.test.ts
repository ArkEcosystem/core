import { Container } from "@arkecosystem/core-kernel";
import { AlreadyForgedHandler } from "@packages/core-blockchain/src/processor/handlers/already-forged-handler";
import { BlockProcessorResult } from "@packages/core-blockchain/src/processor";
import { Interfaces } from "@arkecosystem/crypto";

describe("AlreadyForgedHandler", () => {
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
            const alreadyForgedHandler = container.resolve<AlreadyForgedHandler>(AlreadyForgedHandler);

            const block = {};
            const result = await alreadyForgedHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.DiscardedButCanBeBroadcasted);
            expect(blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
        });
    });
});
