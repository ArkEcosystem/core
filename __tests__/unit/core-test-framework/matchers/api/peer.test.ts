import "@packages/core-test-framework/src/matchers/api/peer";

let peer: any;

beforeEach(() => {
    peer = {
        ip: "127.0.0.1",
        port: 4004,
    };
});

describe("Peer", () => {
    describe("toBeValidPeer", () => {
        it("should be valid peer", async () => {
            expect(peer).toBeValidPeer();
        });

        it("should not be valid peer", async () => {
            delete peer.port;
            expect(peer).not.toBeValidPeer();
        });
    });

    describe("toBeValidArrayOfPeers", () => {
        it("should not pass if not array", async () => {
            expect(peer).not.toBeValidArrayOfPeers();
        });

        it("should not pass if peer is not valid", async () => {
            delete peer.port;
            expect([peer]).not.toBeValidArrayOfPeers();
        });

        it("should pass if peer is valid", async () => {
            expect([peer]).toBeValidArrayOfPeers();
        });
    });
});
