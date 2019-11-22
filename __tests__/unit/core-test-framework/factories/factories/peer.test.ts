import "jest-extended";

import { FactoryBuilder, Factories } from "@packages/core-test-framework/src/factories";

interface Peer {
    ip: string;
    port: number;
    version: string;
    latency: number;
}

let factory: FactoryBuilder;

beforeEach(() => {
    factory = new FactoryBuilder();

    Factories.registerPeerFactory(factory);
});

describe("PeerFactory", () => {
    it("should create a single peer", () => {
        const entity: Peer = factory.get("Peer").make<Peer>() as Peer;

        expect(entity.ip).toBeString();
        expect(entity.port).toBeNumber();
        expect(entity.version).toBeString();
        expect(entity.latency).toBeNumber();
    });

    it("should many peers", () => {
        const entities: Peer[] = factory.get("Peer").makeMany<Peer>(5) as Peer[];

        expect(entities).toBeArrayOfSize(5);

        for (const entity of entities) {
            expect(entity.ip).toBeString();
            expect(entity.port).toBeNumber();
            expect(entity.version).toBeString();
            expect(entity.latency).toBeNumber();
        }
    });
});
