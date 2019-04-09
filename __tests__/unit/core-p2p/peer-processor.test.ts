import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { createPeerService, stubPeer } from "../../helpers/peers";

let processor: P2P.IPeerProcessor;
let storage: P2P.IPeerStorage;
let connector: P2P.IPeerConnector;
let communicator: P2P.IPeerCommunicator;

beforeEach(() => {
    jest.resetAllMocks();

    ({ connector, communicator, processor, storage } = createPeerService());
});

describe("PeerProcessor", () => {
    describe("acceptNewPeer", () => {
        it("should accept the peer", async () => {
            processor.validatePeer = jest.fn(() => true);
            communicator.ping = jest.fn();

            expect(storage.hasPeers()).toBeFalse();

            await processor.validateAndAcceptPeer(stubPeer, { seed: false, lessVerbose: false });

            expect(storage.hasPeers()).toBeTrue();
        });
    });

    describe("suspend", () => {
        it("should suspend the peer from ip provided", async () => {
            storage.setPeer(stubPeer);

            connector.disconnect = jest.fn();

            await processor.suspend(stubPeer);

            expect(connector.disconnect).toHaveBeenCalledWith(stubPeer);
        });
    });
});
