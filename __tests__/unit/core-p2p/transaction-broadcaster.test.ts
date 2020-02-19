import "jest-extended";
import { Interfaces } from "@packages/crypto/src";
import { Container } from "@packages/core-kernel/src";
import { TransactionBroadcaster } from "@packages/core-p2p/src/transaction-broadcaster";

describe("TransactionBroadcaster", () => {
    let container: Container.Container;
    let logger: { warning: jest.Mock; debug: jest.Mock };
    let configuration: { getRequired: jest.Mock };
    let storage: { getPeers: jest.Mock };
    let communicator: { postTransactions: jest.Mock };

    beforeEach(() => {
        logger = { warning: jest.fn(), debug: jest.fn() };
        configuration = { getRequired: jest.fn() };
        storage = { getPeers: jest.fn() };
        communicator = { postTransactions: jest.fn() };

        container = new Container.Container();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PluginConfiguration).toConstantValue(configuration);
        container.bind(Container.Identifiers.PeerStorage).toConstantValue(storage);
        container.bind(Container.Identifiers.PeerCommunicator).toConstantValue(communicator);
    });

    it("should warn when attempting to broadcast empty array", async () => {
        const broadcaster = container.resolve(TransactionBroadcaster);

        await broadcaster.broadcastTransactions([]);

        expect(logger.warning).toBeCalledWith("Broadcasting 0 transactions");
        expect(configuration.getRequired).not.toBeCalled();
        expect(storage.getPeers).not.toBeCalled();
        expect(communicator.postTransactions).not.toBeCalled();
    });

    it("should broadcast transaction to peers", async () => {
        const peers = [{}, {}, {}];
        configuration.getRequired.mockReturnValue(3);
        storage.getPeers.mockReturnValue(peers);
        const broadcaster = container.resolve(TransactionBroadcaster);
        const jsons = [{}];
        const transactions = ([
            { toJson: jest.fn().mockReturnValue(jsons[0]) },
        ] as unknown) as Interfaces.ITransaction[];

        await broadcaster.broadcastTransactions(transactions);

        expect(configuration.getRequired).toBeCalledWith("maxPeersBroadcast");
        expect(storage.getPeers).toBeCalled();
        expect(logger.debug).toBeCalledWith("Broadcasting 1 transaction to 3 peers");
        expect(transactions[0].toJson).toBeCalled();
        expect(communicator.postTransactions).toBeCalledWith(peers[0], jsons);
        expect(communicator.postTransactions).toBeCalledWith(peers[1], jsons);
    });
});
