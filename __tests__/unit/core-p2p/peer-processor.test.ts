import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { createPeerService, createStubPeer, stubPeer } from "../../helpers/peers";

let processor: P2P.IPeerProcessor;
let storage: P2P.IPeerStorage;
let connector: P2P.IPeerConnector;
let communicator: P2P.IPeerCommunicator;

beforeEach(() => {
    jest.resetAllMocks();

    ({ connector, communicator, processor, storage } = createPeerService());
});

describe("PeerProcessor", () => {
    describe("validateAndAcceptPeer", () => {
        it("should accept the peer", async () => {
            processor.validatePeer = jest.fn(() => true);
            communicator.ping = jest.fn();

            expect(storage.hasPeers()).toBeFalse();

            await processor.validateAndAcceptPeer(stubPeer, { seed: false, lessVerbose: false });

            expect(storage.hasPeers()).toBeTrue();
        });

        it("shouldn't accept more peers sharing same /24 subnet than configured limit", async () => {
            communicator.ping = jest.fn();
            const stubPeers = [
                createStubPeer({ ip: "1.2.3.4", port: 4000 }),
                createStubPeer({ ip: "1.2.3.5", port: 4000 }),
                createStubPeer({ ip: "1.2.3.6", port: 4000 }),
                createStubPeer({ ip: "1.2.3.7", port: 4000 }),
                createStubPeer({ ip: "1.2.3.8", port: 4000 }),
                createStubPeer({ ip: "1.2.3.9", port: 4000 }),
            ];

            expect(storage.hasPeers()).toBeFalse();

            for (const peer of stubPeers) {
                await processor.validateAndAcceptPeer(peer, { seed: false, lessVerbose: false });
            }

            expect(storage.getPeers()).toHaveLength(5);
        });

        it("should accept 30 peers while they dont share same /24 subnet", async () => {
            communicator.ping = jest.fn();
            const stubPeers = [];
            for (let i = 0; i < 30; i++) {
                stubPeers.push(createStubPeer({ ip: `1.2.${i}.4`, port: 4000 }))
            }

            expect(storage.hasPeers()).toBeFalse();

            for (const peer of stubPeers) {
                await processor.validateAndAcceptPeer(peer, { seed: false, lessVerbose: false });
            }

            expect(storage.getPeers()).toHaveLength(30);
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
