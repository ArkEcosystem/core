import "jest-extended";

import { Peer } from "@packages/core-p2p";
import { Factories, FactoryBuilder } from "@packages/core-test-framework/src/factories";

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerPeerFactory(factory);
});

describe("PeerFactory", () => {
    it("should create a single peer", () => {
        const entity: Peer = factory.get("Peer").make<Peer>();

        expect(entity).toBeInstanceOf(Peer);
        expect(entity.ip).toBeString();
        expect(entity.port).toBeNumber();
        expect(entity.version).toBeString();
        expect(entity.latency).toBeNumber();
    });

    it("should many peers", () => {
        const entities: Peer[] = factory.get("Peer").makeMany<Peer>(5);

        expect(entities).toBeArrayOfSize(5);

        for (const entity of entities) {
            expect(entity).toBeInstanceOf(Peer);
            expect(entity.ip).toBeString();
            expect(entity.port).toBeNumber();
            expect(entity.version).toBeString();
            expect(entity.latency).toBeNumber();
        }
    });
});
