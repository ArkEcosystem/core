import { Container } from "@arkecosystem/core-kernel";

import { PeerRepository } from "@arkecosystem/core-p2p/src/peer-repository";
import { Peer } from "@arkecosystem/core-p2p/src/peer";

describe("PeerRepository", () => {
    let peerStorage: PeerRepository;

    beforeEach(() => {
        const container = new Container.Container();

        const logger = { warning: jest.fn(), debug: jest.fn() };

        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerRepository).to(PeerRepository);

        peerStorage = container.get<PeerRepository>(Container.Identifiers.PeerRepository);
    });

    describe("getPeers", () => {
        it("should return all the peers in an array", () => {
            const peers = [
                new Peer("176.165.66.55", 4000),
                new Peer("176.165.44.33", 4000),
                new Peer("2001:3984:3989::104", 4000),
            ];
            peers.map((peer) => peerStorage.setPeer(peer));

            expect(peerStorage.getPeers()).toEqual(peers);
        });
    });

    describe("hasPeers", () => {
        it("should return true if there is more than zero peer", () => {
            const peers = [
                new Peer("176.165.66.55", 4000),
                new Peer("176.165.44.33", 4000),
                new Peer("176.165.22.11", 4000),
                new Peer("2001:3984:3989::104", 4000),
            ];

            expect(peerStorage.hasPeers()).toBeFalse();

            for (const peer of peers) {
                peerStorage.setPeer(peer);
                expect(peerStorage.hasPeers()).toBeTrue();
            }
        });

        it("should return false if there is zero peer", () => {
            expect(peerStorage.hasPeers()).toBeFalse();
        });
    });

    describe("getPeer", () => {
        it("should return the peer by its ip", () => {
            const peersByIp = {
                "176.165.66.55": new Peer("176.165.66.55", 4000),
                "176.165.44.33": new Peer("176.165.44.33", 4000),
                "2001:3984:3989::104": new Peer("2001:3984:3989::104", 4000),
            };
            Object.values(peersByIp).map((peer) => peerStorage.setPeer(peer));

            for (const [ip, peer] of Object.entries(peersByIp)) {
                expect(peerStorage.getPeer(ip)).toEqual(peer);
            }
        });

        it("should throw when no peer exists for the ip", () => {
            const peersByIp = {
                "176.165.66.55": new Peer("176.165.66.55", 4000),
                "176.165.44.33": new Peer("176.165.44.33", 4000),
                "2001:3984:3989::104": new Peer("2001:3984:3989::104", 4000),
            };
            Object.values(peersByIp).map((peer) => peerStorage.setPeer(peer));

            expect(() => peerStorage.getPeer("127.0.0.1")).toThrow();
        });
    });

    describe("setPeer", () => {
        it("should set the peer by its ip", () => {
            const peersByIp = {
                "176.165.66.55": new Peer("176.165.66.55", 4000),
                "176.165.44.33": new Peer("176.165.44.33", 4000),
                "2001:3984:3989::104": new Peer("2001:3984:3989::104", 4000),
            };
            Object.values(peersByIp).map((peer) => peerStorage.setPeer(peer));

            for (const [ip, peer] of Object.entries(peersByIp)) {
                expect(peerStorage.getPeer(ip)).toEqual(peer);
            }
        });
    });

    describe("forgetPeer", () => {
        it("should forget the peer", () => {
            const peer = new Peer("176.165.66.55", 4000);

            peerStorage.setPeer(peer);

            expect(peerStorage.hasPeer(peer.ip)).toBeTrue();
            expect(peerStorage.getPeer(peer.ip)).toEqual(peer);

            peerStorage.forgetPeer(peer);

            expect(peerStorage.hasPeer(peer.ip)).toBeFalse();
            expect(() => peerStorage.getPeer(peer.ip)).toThrow();
        });
    });

    describe("hasPeer", () => {
        it("should return true if the peer exists", () => {
            const peer = new Peer("176.165.66.55", 4000);

            peerStorage.setPeer(peer);

            expect(peerStorage.hasPeer(peer.ip)).toBeTrue();
        });

        it("should return false if the peer does not exist", () => {
            expect(peerStorage.hasPeer("176.165.66.55")).toBeFalse();
        });
    });

    describe("getPendingPeers", () => {
        it("should return the pending peers", () => {
            const peers = [new Peer("176.165.66.55", 4000), new Peer("176.165.44.33", 4000)];
            peers.map((peer) => peerStorage.setPendingPeer(peer));

            expect(peerStorage.getPendingPeers()).toEqual(peers);
        });
    });

    describe("hasPendingPeers", () => {
        it("should return true if there is more than zero pending peer", () => {
            const peers = [
                new Peer("176.165.66.55", 4000),
                new Peer("176.165.44.33", 4000),
                new Peer("176.165.22.11", 4000),
                new Peer("2001:3984:3989::104", 4000),
            ];

            expect(peerStorage.hasPendingPeers()).toBeFalse();

            for (const peer of peers) {
                peerStorage.setPendingPeer(peer);
                expect(peerStorage.hasPendingPeers()).toBeTrue();
            }
        });

        it("should return false if there is zero pending peer", () => {
            expect(peerStorage.hasPendingPeers()).toBeFalse();
        });
    });

    describe("getPendingPeer", () => {
        it("should return the pending peer by its ip", () => {
            const peersByIp = {
                "176.165.66.55": new Peer("176.165.66.55", 4000),
                "176.165.44.33": new Peer("176.165.44.33", 4000),
                "2001:3984:3989::104": new Peer("2001:3984:3989::104", 4000),
            };
            Object.values(peersByIp).map((peer) => peerStorage.setPendingPeer(peer));

            for (const [ip, peer] of Object.entries(peersByIp)) {
                expect(peerStorage.getPendingPeer(ip)).toEqual(peer);
            }
        });

        it("should throw when no pending peer exists for the ip", () => {
            const peersByIp = {
                "176.165.66.55": new Peer("176.165.66.55", 4000),
                "176.165.44.33": new Peer("176.165.44.33", 4000),
                "2001:3984:3989::104": new Peer("2001:3984:3989::104", 4000),
            };
            Object.values(peersByIp).map((peer) => peerStorage.setPendingPeer(peer));

            expect(() => peerStorage.getPendingPeer("127.0.0.1")).toThrow();
        });
    });

    describe("setPendingPeer", () => {
        it("should set the pending peer by its ip", () => {
            const peersByIp = {
                "176.165.66.55": new Peer("176.165.66.55", 4000),
                "176.165.44.33": new Peer("176.165.44.33", 4000),
                "2001:3984:3989::104": new Peer("2001:3984:3989::104", 4000),
            };
            Object.values(peersByIp).map((peer) => peerStorage.setPendingPeer(peer));

            for (const [ip, peer] of Object.entries(peersByIp)) {
                expect(peerStorage.getPendingPeer(ip)).toEqual(peer);
            }
        });
    });

    describe("forgetPendingPeer", () => {
        it("should forget the pending peer", () => {
            const peer = new Peer("176.165.66.55", 4000);

            peerStorage.setPendingPeer(peer);

            expect(peerStorage.hasPendingPeer(peer.ip)).toBeTrue();
            expect(peerStorage.getPendingPeer(peer.ip)).toEqual(peer);

            peerStorage.forgetPendingPeer(peer);

            expect(peerStorage.hasPendingPeer(peer.ip)).toBeFalse();
            expect(() => peerStorage.getPendingPeer(peer.ip)).toThrow();
        });
    });

    describe("hasPendingPeer", () => {
        it("should return true if the pending peer exists", () => {
            const peer = new Peer("176.165.66.55", 4000);

            peerStorage.setPendingPeer(peer);

            expect(peerStorage.hasPendingPeer(peer.ip)).toBeTrue();
        });

        it("should return false if the pending peer does not exist", () => {
            expect(peerStorage.hasPendingPeer("176.165.66.55")).toBeFalse();
        });
    });

    describe("getSameSubnetPeers", () => {
        it("should get the peers within same subnet of provided ip", () => {
            const peers = [
                new Peer("176.165.66.55", 4000),
                new Peer("176.165.66.33", 4000),
                new Peer("176.165.22.11", 4000),
                new Peer("2001:3984:3989::104", 4000),
            ];

            peers.map((peer) => peerStorage.setPeer(peer));

            expect(peerStorage.getSameSubnetPeers("176.165.66.10")).toHaveLength(2);
            expect(peerStorage.getSameSubnetPeers("176.165.22.99")).toHaveLength(1);
            expect(peerStorage.getSameSubnetPeers("176.165.23.10")).toHaveLength(0);
        });
    });
});
