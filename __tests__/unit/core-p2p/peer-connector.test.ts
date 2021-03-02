import "jest-extended";

import { Container } from "@arkecosystem/core-kernel";
import * as Nes from "@packages/core-p2p/src/hapi-nes";
import { Peer } from "@packages/core-p2p/src/peer";
import { PeerConnector } from "@packages/core-p2p/src/peer-connector";

import { NesClient } from "./mocks/nes";

jest.setTimeout(60000);

const spyOnClient = jest.spyOn(Nes, "Client").mockImplementation((url) => new (NesClient as any)());

describe("PeerConnector", () => {
    let peerConnector: PeerConnector;
    let logger;

    beforeEach(() => {
        logger = { warning: jest.fn(), debug: jest.fn(), error: jest.fn(), info: jest.fn() };

        const container = new Container.Container();
        container.unbindAll();
        container.bind(Container.Identifiers.LogService).toConstantValue(logger);
        container.bind(Container.Identifiers.PeerConnector).to(PeerConnector);

        peerConnector = container.get<PeerConnector>(Container.Identifiers.PeerConnector);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("all", () => {
        it("should return a empty array when there are no connections", () => {
            expect(peerConnector.all()).toBeArrayOfSize(0);
        });

        it("should return the connections", async () => {
            const peers = [new Peer("178.165.55.44", 4000), new Peer("178.165.55.33", 4000)];
            await peerConnector.connect(peers[0]);
            await peerConnector.connect(peers[1]);

            expect(peerConnector.all()).toBeArrayOfSize(2);
        });
    });

    describe("connection", () => {
        it("should return the connection", async () => {
            const peers = [
                new Peer("178.165.55.44", 4000),
                new Peer("178.165.55.33", 4000),
                new Peer("2001:3984:3989::104", 4000),
            ];
            await peerConnector.connect(peers[0]);
            await peerConnector.connect(peers[1]);
            await peerConnector.connect(peers[2]);

            expect(peerConnector.connection(peers[0])).toBeInstanceOf(NesClient);
            expect(peerConnector.connection(peers[1])).toBeInstanceOf(NesClient);
            expect(peerConnector.connection(peers[2])).toBeInstanceOf(NesClient);
        });

        it("should return undefined if there is no connection", async () => {
            const peerNotAdded = new Peer("178.0.0.0", 4000);
            expect(peerConnector.connection(peerNotAdded)).toBeUndefined();
        });
    });

    describe("connect", () => {
        it("should set the connection in the connections and return it", async () => {
            const peer = new Peer("178.165.55.11", 4000);
            const peerConnection = await peerConnector.connect(peer);

            expect(spyOnClient).toHaveBeenCalledTimes(1);
            expect(spyOnClient).toHaveBeenCalledWith("ws://178.165.55.11:4000", { timeout: 10000 });
            expect(peerConnection).toBeInstanceOf(NesClient);
            expect(peerConnection).toBe(peerConnector.connection(peer));
        });

        it("should set the connection with brackets IPv6", async () => {
            const peer = new Peer("2001:3984:3989::104", 4000);
            const peerConnection = await peerConnector.connect(peer);

            expect(spyOnClient).toHaveBeenCalledTimes(1);
            expect(spyOnClient).toHaveBeenCalledWith("ws://[2001:3984:3989::104]:4000", { timeout: 10000 });
            expect(peerConnection).toBeInstanceOf(NesClient);
            expect(peerConnection).toBe(peerConnector.connection(peer));
        });

        it("should log and remove if error on connection", async () => {
            const peer = new Peer("178.165.55.11", 4000);
            const peerConnection = await peerConnector.connect(peer);

            peerConnection.onError(new Error("dummy"));

            expect(peerConnection).toBeInstanceOf(NesClient);
            expect(logger.debug).toHaveBeenCalled();
            expect(peerConnector.connection(peer)).toBeUndefined();
        });

        it("should delay connection create if re-connecting within 10 seconds", async () => {
            const peer = new Peer("178.165.55.11", 4000);
            await peerConnector.connect(peer);

            peerConnector.disconnect(peer);

            const before = Date.now();
            await peerConnector.connect(peer);
            expect((Date.now() - before) / 1000).toBeCloseTo(10, 1); // close to 10 seconds
        });
    });

    describe("disconnect", () => {
        it("should call terminate on the connection and forget it", async () => {
            const peer = new Peer("178.165.55.11", 4000);
            const peerConnection = await peerConnector.connect(peer);
            const spyTerminate = jest.spyOn(peerConnection, "terminate");

            expect(peerConnector.connection(peer)).toBeInstanceOf(NesClient);

            peerConnector.disconnect(peer);
            expect(peerConnector.connection(peer)).toBeUndefined();
            expect(spyTerminate).toBeCalledTimes(1);
        });

        it("should not do anything if the peer is not defined", async () => {
            const peer = new Peer("178.165.0.0", 4000);

            expect(peerConnector.connection(peer)).toBeUndefined();

            peerConnector.disconnect(peer);
            expect(peerConnector.connection(peer)).toBeUndefined();
        });
    });

    describe("emit", () => {
        it("should connect to the peer and call connection.request", async () => {
            const peer = new Peer("178.165.11.12", 4000);

            const peerConnection = await peerConnector.connect(peer);

            const mockResponse = { payload: "mock payload" };
            // @ts-ignore
            const spyRequest = jest.spyOn(peerConnection, "request").mockReturnValue(mockResponse);

            const response = await peerConnector.emit(peer, "p2p.peer.getStatus", {});

            expect(spyRequest).toBeCalledTimes(1);
            expect(response).toEqual(mockResponse);
        });
    });

    describe("getError", () => {
        it("should return the error set for the peer", () => {
            const peer = new Peer("178.165.11.12", 4000);

            const peerError = `some random error for the peer ${peer.ip}`;
            peerConnector.setError(peer, peerError);

            expect(peerConnector.getError(peer)).toBe(peerError);
        });

        it("should return undefined when the peer has no error set", () => {
            const peer = new Peer("178.165.11.12", 4000);

            expect(peerConnector.getError(peer)).toBeUndefined();
        });
    });

    describe("setError", () => {
        it("should set the error for the peer", () => {
            const peer = new Peer("178.165.11.12", 4000);

            const peerError = `some random error for the peer ${peer.ip}`;
            peerConnector.setError(peer, peerError);

            expect(peerConnector.getError(peer)).toBe(peerError);
        });
    });

    describe("hasError", () => {
        it("should return true if the peer has the error specified set", () => {
            const peer = new Peer("178.165.11.12", 4000);

            const peerError = `some random error for the peer ${peer.ip}`;
            peerConnector.setError(peer, peerError);

            expect(peerConnector.hasError(peer, peerError)).toBeTrue();
        });

        it("should return false if the peer has not the error specified set", () => {
            const peer = new Peer("178.165.11.12", 4000);

            const peerError = `some random error for the peer ${peer.ip}`;
            peerConnector.setError(peer, peerError);

            expect(peerConnector.hasError(peer, "a different error")).toBeFalse();
        });

        it("should return false if the peer has no error", () => {
            const peer = new Peer("178.165.11.12", 4000);

            const peerError = `some random error for the peer ${peer.ip}`;

            expect(peerConnector.hasError(peer, peerError)).toBeFalse();
        });
    });

    describe("forgetError", () => {
        it("should forget the error set for the peer", () => {
            const peer = new Peer("178.165.11.12", 4000);

            const peerError = `some random error for the peer ${peer.ip}`;
            peerConnector.setError(peer, peerError);

            expect(peerConnector.getError(peer)).toBe(peerError);

            peerConnector.forgetError(peer);
            expect(peerConnector.getError(peer)).toBeUndefined();
        });
    });
});
