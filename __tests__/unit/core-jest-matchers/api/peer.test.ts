import "../../../../packages/core-jest-matchers/src/api/peer";

let peer;

beforeEach(() => {
    peer = { ip: "", port: "" };
});

describe(".toBeValidPeer", () => {
    test("passes pass given a valid peer", () => {
        expect(peer).toBeValidPeer();
    });

    test("fails given an invalid peer", () => {
        delete peer.ip;
        expect(expect(peer).toBeValidPeer).toThrowError(/Expected .* to be a valid peer/);
    });
});

describe(".toBeValidArrayOfPeers", () => {
    test("passes given an array of valid peers", () => {
        expect([peer, peer]).toBeValidArrayOfPeers();
    });

    test("fails given an array with an invalid peer", () => {
        delete peer.ip;
        expect(expect([peer, peer]).toBeValidArrayOfPeers).toThrowError(/Expected .* to be a valid array of peers/);
    });

    test("fails when not given an array of peers", () => {
        expect(expect(peer).toBeValidArrayOfPeers).toThrowError(/Expected .* to be a valid array of peers/);
    });
});
