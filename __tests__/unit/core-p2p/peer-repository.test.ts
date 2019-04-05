import "jest-extended";
import { PeerRepository } from "../../../packages/core-p2p/src/peer-repository";

interface IPeer {
    ip: string;
    port: number;
}

let repo: PeerRepository<IPeer>;
let peer: IPeer;
beforeEach(() => {
    repo = new PeerRepository<IPeer>();
    peer = { ip: "127.0.0.1", port: 4000 };
});

describe("PeerRepository", () => {
    it("should return the underlying repository", () => {
        repo.set(peer.ip, peer);

        expect(repo.all()).toEqual(new Map().set(peer.ip, peer));
    });

    it("should return all entries", () => {
        repo.set(peer.ip, peer);

        expect(repo.entries()).toEqual([[peer.ip, peer]]);
    });

    it("should return all keys", () => {
        repo.set(peer.ip, peer);

        expect(repo.keys()).toEqual([peer.ip]);
    });

    it("should return all values", () => {
        repo.set(peer.ip, peer);

        expect(repo.values()).toEqual([peer]);
    });

    it("should get an item and remove it", () => {
        repo.set(peer.ip, peer);

        expect(repo.pull(peer.ip)).toEqual(peer);

        expect(repo.isEmpty()).toBeTrue();
    });

    it("should get an item", () => {
        repo.set(peer.ip, peer);

        expect(repo.get(peer.ip)).toEqual(peer);
    });
    it("should set an item", () => {
        repo.set(peer.ip, peer);

        expect(repo.has(peer.ip)).toBeTrue();
    });

    it("should forget an item", () => {
        repo.set(peer.ip, peer);

        expect(repo.isEmpty()).toBeFalse();

        repo.forget(peer.ip);

        expect(repo.isEmpty()).toBeTrue();
    });
    it("should flush all items", () => {
        repo.set(peer.ip, peer);

        expect(repo.isEmpty()).toBeFalse();

        repo.flush();

        expect(repo.isEmpty()).toBeTrue();
    });

    describe("has", () => {
        it("should return true if an item exists", () => {
            repo.set(peer.ip, peer);

            expect(repo.has(peer.ip)).toBeTrue();
        });

        it("should return false if an item doesn't exist", () => {
            expect(repo.has(peer.ip)).toBeFalse();
        });
    });

    describe("missing", () => {
        it("should return false if an item is missing", () => {
            repo.set(peer.ip, peer);

            expect(repo.missing(peer.ip)).toBeFalse();
        });

        it("should return true if an item isn't missing", () => {
            expect(repo.missing(peer.ip)).toBeTrue();
        });
    });

    it("should count all items", () => {
        repo.set(peer.ip, peer);

        expect(repo.count()).toBe(1);
    });

    describe("isEmpty", () => {
        it("should return false if there are items", () => {
            repo.set(peer.ip, peer);

            expect(repo.isEmpty()).toBeFalse();
        });

        it("should return true if there are no items", () => {
            expect(repo.isEmpty()).toBeTrue();
        });
    });

    describe("isNotEmpty", () => {
        it("should return true if there are items", () => {
            repo.set(peer.ip, peer);

            expect(repo.isNotEmpty()).toBeTrue();
        });

        it("should return false if there are no items", () => {
            expect(repo.isNotEmpty()).toBeFalse();
        });
    });

    it("should return a random peer", () => {
        repo.set(peer.ip, peer);

        expect(repo.random()).toEqual(peer);
    });

    it("should turn the items into JSON", () => {
        repo.set(peer.ip, peer);

        expect(repo.toJson()).toEqual(JSON.stringify({ [peer.ip]: peer }));
    });
});
