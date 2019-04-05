import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { Peer } from "../../../packages/core-p2p/src/peer";
import { makePeerService } from "../../../packages/core-p2p/src/plugin";

const stubPeer: P2P.IPeer = new Peer("1.2.3.4", 4000);

let processor;
let storage;
let connector;
let communicator;
beforeEach(() => {
    const service = makePeerService();
    processor = service.getProcessor();
    storage = service.getStorage();
    connector = service.getConnector();
    communicator = service.getCommunicator();
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
