import "jest-extended";

import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { PeerRepository } from "../../../packages/core-p2p/src/peer-repository";
import { stubPeer } from "../../helpers/peers";

let repo: PeerRepository<P2P.IPeer>;

beforeEach(() => {
    repo = new PeerRepository<P2P.IPeer>();
});

describe("PeerRepository", () => {
    it("should return the underlying repository", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.all()).toEqual(new Map().set(stubPeer.ip, stubPeer));
    });

    it("should return all entries", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.entries()).toEqual([[stubPeer.ip, stubPeer]]);
    });

    it("should return all keys", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.keys()).toEqual([stubPeer.ip]);
    });

    it("should return all values", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.values()).toEqual([stubPeer]);
    });

    it("should get an item and remove it", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.pull(stubPeer.ip)).toEqual(stubPeer);

        expect(repo.isEmpty()).toBeTrue();
    });

    it("should get an item", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.get(stubPeer.ip)).toEqual(stubPeer);
    });
    it("should set an item", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.has(stubPeer.ip)).toBeTrue();
    });

    it("should forget an item", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.isEmpty()).toBeFalse();

        repo.forget(stubPeer.ip);

        expect(repo.isEmpty()).toBeTrue();
    });

    it("should flush all items", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.isEmpty()).toBeFalse();

        repo.flush();

        expect(repo.isEmpty()).toBeTrue();
    });

    describe("has", () => {
        it("should return true if an item exists", () => {
            repo.set(stubPeer.ip, stubPeer);

            expect(repo.has(stubPeer.ip)).toBeTrue();
        });

        it("should return false if an item doesn't exist", () => {
            expect(repo.has(stubPeer.ip)).toBeFalse();
        });
    });

    describe("missing", () => {
        it("should return false if an item is missing", () => {
            repo.set(stubPeer.ip, stubPeer);

            expect(repo.missing(stubPeer.ip)).toBeFalse();
        });

        it("should return true if an item isn't missing", () => {
            expect(repo.missing(stubPeer.ip)).toBeTrue();
        });
    });

    it("should count all items", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.count()).toBe(1);
    });

    describe("isEmpty", () => {
        it("should return false if there are items", () => {
            repo.set(stubPeer.ip, stubPeer);

            expect(repo.isEmpty()).toBeFalse();
        });

        it("should return true if there are no items", () => {
            expect(repo.isEmpty()).toBeTrue();
        });
    });

    describe("isNotEmpty", () => {
        it("should return true if there are items", () => {
            repo.set(stubPeer.ip, stubPeer);

            expect(repo.isNotEmpty()).toBeTrue();
        });

        it("should return false if there are no items", () => {
            expect(repo.isNotEmpty()).toBeFalse();
        });
    });

    it("should return a random item", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.random()).toEqual(stubPeer);
    });

    it("should turn the items into JSON", () => {
        repo.set(stubPeer.ip, stubPeer);

        expect(repo.toJson()).toEqual(JSON.stringify({ [stubPeer.ip]: stubPeer }));
    });
});
