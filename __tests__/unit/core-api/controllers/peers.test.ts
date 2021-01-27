import "jest-extended";

import Hapi from "@hapi/hapi";
import { PeersController } from "@packages/core-api/src/controllers/peers";
import { Application, Contracts } from "@packages/core-kernel";
import { Identifiers } from "@packages/core-kernel/src/ioc";
import { Transactions as MagistrateTransactions } from "@packages/core-magistrate-crypto";
import { Mocks } from "@packages/core-test-framework";
import { TransactionHandlerRegistry } from "@packages/core-transactions/src/handlers/handler-registry";
import { Transactions } from "@packages/crypto";

import { initApp, ItemResponse, PaginatedResponse } from "../__support__";

let app: Application;
let controller: PeersController;

beforeEach(() => {
    app = initApp();
    app.bind(Identifiers.TransactionHistoryService).toConstantValue(null);

    // Triggers registration of indexes
    app.get<TransactionHandlerRegistry>(Identifiers.TransactionHandlerRegistry);

    controller = app.resolve<PeersController>(PeersController);

    Mocks.PeerRepository.setPeers([]);
});

afterEach(() => {
    try {
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BusinessRegistrationTransaction,
        );
        Transactions.TransactionRegistry.deregisterTransactionType(
            MagistrateTransactions.BridgechainRegistrationTransaction,
        );
    } catch {}
});

describe("PeersController", () => {
    let peer: Partial<Contracts.P2P.Peer>;
    let anotherPeer: Partial<Contracts.P2P.Peer>;

    beforeEach(() => {
        peer = {
            version: "2.6.0",
            latency: 200,
            ip: "127.0.0.1",
            port: 4000,
            ports: {
                "127.0.0.1": 4000,
            },
            state: {
                height: 1,
                forgingAllowed: false,
                currentSlot: 1,
                header: {},
            },
        };

        anotherPeer = {
            version: "2.6.1",
            latency: 300,
            ip: "127.0.0.2",
            port: 4000,
            ports: {
                "127.0.0.2": 4000,
            },
            state: {
                height: 2,
                forgingAllowed: false,
                currentSlot: 1,
                header: {},
            },
        };
    });

    describe("index", () => {
        it("should return list of peers", async () => {
            Mocks.PeerRepository.setPeers([peer, anotherPeer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6",
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
        });

        it("should return list of peers if version in request is not set", async () => {
            Mocks.PeerRepository.setPeers([peer, anotherPeer]);

            const request: Hapi.Request = {
                query: {
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
        });

        it("should return error if version in request is invalid", async () => {
            const request: Hapi.Request = {
                query: {
                    version: "invalid_version",
                    page: 1,
                    limit: 100,
                    transform: false,
                },
            };

            await expect(controller.index(request, undefined)).resolves.toThrowError("Invalid version range provided");
        });

        it("should return error when offset is negative", async () => {
            Mocks.PeerRepository.setPeers([peer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6.0",
                    page: 2,
                    limit: 100,
                    transform: false,
                    offset: -1,
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
        });

        it("should return paginated response when offset is not a number", async () => {
            Mocks.PeerRepository.setPeers([peer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6.0",
                    page: 2,
                    limit: 100,
                    transform: false,
                    offset: "invalid",
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
        });

        it("should return paginated response when limit is not defined", async () => {
            Mocks.PeerRepository.setPeers([peer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6.0",
                    page: 2,
                    transform: false,
                    offset: -1,
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
        });

        it("should return list of peers ordered by version ascending", async () => {
            Mocks.PeerRepository.setPeers([peer, anotherPeer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6",
                    page: 1,
                    limit: 100,
                    transform: false,
                    orderBy: "version:asc",
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
            expect(response.results[1]).toEqual(
                expect.objectContaining({
                    ip: anotherPeer.ip,
                }),
            );
        });

        it("should return list of peers ordered by version descending", async () => {
            Mocks.PeerRepository.setPeers([peer, anotherPeer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6",
                    page: 1,
                    limit: 100,
                    transform: false,
                    orderBy: "version:desc",
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    ip: anotherPeer.ip,
                }),
            );
            expect(response.results[1]).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
        });

        it("should return list of peers ordered by height ascending", async () => {
            Mocks.PeerRepository.setPeers([peer, anotherPeer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6",
                    page: 1,
                    limit: 100,
                    transform: false,
                    orderBy: "height:asc",
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
            expect(response.results[1]).toEqual(
                expect.objectContaining({
                    ip: anotherPeer.ip,
                }),
            );
        });

        it("should return list of peers ordered by height descending", async () => {
            Mocks.PeerRepository.setPeers([peer, anotherPeer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6",
                    page: 1,
                    limit: 100,
                    transform: false,
                    orderBy: "height:desc",
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    ip: anotherPeer.ip,
                }),
            );
            expect(response.results[1]).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
        });

        it("should return list of peers ordered by latency ascending", async () => {
            Mocks.PeerRepository.setPeers([peer, anotherPeer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6",
                    page: 1,
                    limit: 100,
                    transform: false,
                    orderBy: "latency:asc",
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
            expect(response.results[1]).toEqual(
                expect.objectContaining({
                    ip: anotherPeer.ip,
                }),
            );
        });

        it("should return list of peers ordered by latency descending", async () => {
            Mocks.PeerRepository.setPeers([peer, anotherPeer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6",
                    page: 1,
                    limit: 100,
                    transform: false,
                    orderBy: "latency:desc",
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    ip: anotherPeer.ip,
                }),
            );
            expect(response.results[1]).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
        });

        it("should return list of peers ordered by other descending", async () => {
            Mocks.PeerRepository.setPeers([peer, anotherPeer]);

            const request: Hapi.Request = {
                query: {
                    version: "2.6",
                    page: 1,
                    limit: 100,
                    transform: false,
                    orderBy: "undefined",
                },
            };

            const response = (await controller.index(request, undefined)) as PaginatedResponse;

            expect(response.totalCount).toBeDefined();
            expect(response.meta).toBeDefined();
            expect(response.results).toBeDefined();
            expect(response.results[0]).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
            expect(response.results[1]).toEqual(
                expect.objectContaining({
                    ip: anotherPeer.ip,
                }),
            );
        });
    });

    describe("show", () => {
        it("should return peer", async () => {
            Mocks.PeerRepository.setPeers([peer]);

            const request: Hapi.Request = {
                params: {
                    id: peer.ip,
                },
            };

            const response = (await controller.show(request, undefined)) as ItemResponse;

            expect(response.data).toEqual(
                expect.objectContaining({
                    ip: peer.ip,
                }),
            );
        });

        it("should return error if peer does not exists", async () => {
            const request: Hapi.Request = {
                params: {
                    id: peer.ip,
                },
            };

            await expect(controller.show(request, undefined)).resolves.toThrowError("Peer not found");
        });
    });
});
