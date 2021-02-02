import { Container } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

import { TransactionBroadcaster } from "../../../packages/core-p2p/src/transaction-broadcaster";

describe("TransactionBroadcaster", () => {
    const container = new Container.Container();

    describe("broadcastTransactions", () => {
        const logger = { warning: jest.fn(), debug: jest.fn() };
        const configuration = { getRequired: jest.fn() };
        const repository = { getPeers: jest.fn() };
        const communicator = { postTransactions: jest.fn() };

        beforeAll(() => {
            container.unbindAll();
            container.bind(Container.Identifiers.LogService).toConstantValue(logger);
            container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
            container.bind(Container.Identifiers.PeerRepository).toConstantValue(repository);
            container.bind(Container.Identifiers.PeerCommunicator).toConstantValue(communicator);
        });

        beforeEach(() => {
            logger.warning.mockClear();
            logger.debug.mockClear();
            configuration.getRequired.mockClear();
            repository.getPeers.mockClear();
            communicator.postTransactions.mockClear();
        });

        it("should warn when attempting to broadcast empty array", async () => {
            const broadcaster = container.resolve(TransactionBroadcaster);

            await broadcaster.broadcastTransactions([]);

            expect(logger.warning).toBeCalledWith("Broadcasting 0 transactions");
            expect(configuration.getRequired).not.toBeCalled();
            expect(repository.getPeers).not.toBeCalled();
            expect(communicator.postTransactions).not.toBeCalled();
        });

        it("should broadcast transaction to peers", async () => {
            const peers = [{}, {}, {}];
            configuration.getRequired.mockReturnValue(3);
            repository.getPeers.mockReturnValue(peers);
            const transactions = [{}];

            const serializedTx = Buffer.alloc(0);
            const spySerialize = jest.spyOn(Transactions.Serializer, "serialize").mockReturnValue(serializedTx);

            const broadcaster = container.resolve(TransactionBroadcaster);
            await broadcaster.broadcastTransactions(transactions as Interfaces.ITransaction[]);

            expect(configuration.getRequired).toBeCalledWith("maxPeersBroadcast");
            expect(repository.getPeers).toBeCalled();
            expect(logger.debug).toBeCalledWith("Broadcasting 1 transaction to 3 peers");
            expect(spySerialize).toBeCalled();
            expect(communicator.postTransactions).toBeCalledWith(peers[0], [serializedTx]);
            expect(communicator.postTransactions).toBeCalledWith(peers[1], [serializedTx]);
        });
    });
});
