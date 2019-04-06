import "jest-extended";

import "./mocks/core-container";

import { createPeerService, stubPeer } from "../../helpers/peers";

let processor;
let storage;
let connector;
let communicator;
beforeEach(() => {
    ({ connector, communicator, processor, storage } = createPeerService());
});

beforeEach(() => {
    jest.resetAllMocks();
});

describe("PeerProcessor", () => {
    describe("acceptNewPeer", () => {
        it("should accept the peer", async () => {
            communicator.ping = jest.fn();

            expect(storage.hasPeers()).toBeFalse();

            await processor.acceptNewPeer(stubPeer, { seed: false, lessVerbose: false });

            expect(storage.hasPeers()).toBeTrue();
        });
    });

    describe("suspendPeer", () => {
        it("should suspend the peer from ip provided", async () => {
            storage.setPeer(stubPeer);

            connector.disconnect = jest.fn();

            await processor.suspend(stubPeer.ip);

            expect(connector.disconnect).toHaveBeenCalledWith(stubPeer.ip);
        });
    });
});
