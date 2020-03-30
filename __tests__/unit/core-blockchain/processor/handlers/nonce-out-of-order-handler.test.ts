import { Container } from "@arkecosystem/core-kernel";
import { NonceOutOfOrderHandler } from "../../../../../packages/core-blockchain/src/processor/handlers/nonce-out-of-order-handler";
import { BlockProcessorResult } from "../../../../../packages/core-blockchain/src/processor";
import { Interfaces } from "@arkecosystem/crypto";

describe("NonceOutOfOrderHandler", () => {
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
            const nonceOutOfOrderHandler = container.resolve<NonceOutOfOrderHandler>(NonceOutOfOrderHandler);

            const block = {};
            const result = await nonceOutOfOrderHandler.execute(block as Interfaces.IBlock);

            expect(result).toBe(BlockProcessorResult.Rejected);
            expect(blockchain.resetLastDownloadedBlock).toBeCalledTimes(1);
        });
    });
});
