import "./mocks/core-container";

import { P2P } from "@arkecosystem/core-interfaces";
import { PeerRepository } from "../../../packages/core-p2p/src/peer-repository";
import { stubPeer } from "../../helpers/peers";

const repository: PeerRepository<P2P.IPeer> = new PeerRepository<P2P.IPeer>();

beforeEach(() => {
    repository.flush();
    repository.set(stubPeer.ip, stubPeer);
});

describe("PeerRepository", () => {
    it("should return the underlying repository", () => {
        expect(repository.all()).toEqual(new Map().set(stubPeer.ip, stubPeer));
    });

    it("should return all entries", () => {
        expect(repository.entries()).toEqual([[stubPeer.ip, stubPeer]]);
    });

    it("should return all keys", () => {
        expect(repository.keys()).toEqual([stubPeer.ip]);
    });

    it("should return all values", () => {
        expect(repository.values()).toEqual([stubPeer]);
    });

    it("should get an item and remove it", () => {
        expect(repository.pull(stubPeer.ip)).toEqual(stubPeer);

        expect(repository.isEmpty()).toBeTrue();
    });

    it("should get an item", () => {
        expect(repository.get(stubPeer.ip)).toEqual(stubPeer);
    });
    it("should set an item", () => {
        expect(repository.has(stubPeer.ip)).toBeTrue();
    });

    it("should forget an item", () => {
        expect(repository.isEmpty()).toBeFalse();

        repository.forget(stubPeer.ip);

        expect(repository.isEmpty()).toBeTrue();
    });

    it("should flush all items", () => {
        expect(repository.isEmpty()).toBeFalse();

        repository.flush();

        expect(repository.isEmpty()).toBeTrue();
    });

    describe("has", () => {
        it("should return true if an item exists", () => {
            expect(repository.has(stubPeer.ip)).toBeTrue();
        });

        it("should return false if an item doesn't exist", () => {
            repository.flush();

            expect(repository.has(stubPeer.ip)).toBeFalse();
        });
    });

    describe("missing", () => {
        it("should return false if an item isn't missing", () => {
            expect(repository.missing(stubPeer.ip)).toBeFalse();
        });

        it("should return true if an item is missing", () => {
            repository.flush();

            expect(repository.missing(stubPeer.ip)).toBeTrue();
        });
    });

    it("should count all items", () => {
        expect(repository.count()).toBe(1);
    });

    describe("isEmpty", () => {
        it("should return false if there are items", () => {
            expect(repository.isEmpty()).toBeFalse();
        });

        it("should return true if there are no items", () => {
            repository.flush();

            expect(repository.isEmpty()).toBeTrue();
        });
    });

    describe("isNotEmpty", () => {
        it("should return true if there are items", () => {
            expect(repository.isNotEmpty()).toBeTrue();
        });

        it("should return false if there are no items", () => {
            repository.flush();

            expect(repository.isNotEmpty()).toBeFalse();
        });
    });

    it("should return a random item", () => {
        expect(repository.random()).toEqual(stubPeer);
    });

    it("should turn the items into JSON", () => {
        expect(repository.toJson()).toEqual(JSON.stringify({ [stubPeer.ip]: stubPeer }));
    });
});
