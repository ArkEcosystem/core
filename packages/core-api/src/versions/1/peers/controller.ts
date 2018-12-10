import { app } from "@arkecosystem/core-container";
import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class PeersController extends Controller {
    protected blockchain: any;
    protected p2p: any;

    public constructor() {
        super();

        this.blockchain = app.resolvePlugin("blockchain");
        this.p2p = app.resolvePlugin("p2p");
    }

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const allPeers = await this.p2p.getPeers();

            if (!allPeers) {
                return super.respondWith("No peers found", true);
            }

            let peers = allPeers
                .map(peer => {
                    // just use 'OK' status for API instead of p2p http status codes
                    peer.status = peer.status === 200 ? "OK" : peer.status;
                    return peer;
                })
                .sort((a, b) => a.delay - b.delay);
            // @ts-ignore
            peers = request.query.os
                ? // @ts-ignore
                  allPeers.filter(peer => peer.os === request.query.os)
                : peers;
            // @ts-ignore
            peers = request.query.status
                ? // @ts-ignore
                  allPeers.filter(peer => peer.status === request.query.status)
                : peers;
            // @ts-ignore
            peers = request.query.port
                ? // @ts-ignore
                  allPeers.filter(peer => peer.port === request.query.port)
                : peers;
            // @ts-ignore
            peers = request.query.version
                ? // @ts-ignore
                  allPeers.filter(peer => peer.version === request.query.version)
                : peers;
            // @ts-ignore
            peers = peers.slice(0, request.query.limit || 100);

            // @ts-ignore
            if (request.query.orderBy) {
                // @ts-ignore
                const order = request.query.orderBy.split(":");
                if (["port", "status", "os", "version"].includes(order[0])) {
                    peers =
                        order[1].toUpperCase() === "ASC"
                            ? peers.sort((a, b) => a[order[0]] - b[order[0]])
                            : peers.sort((a, b) => a[order[0]] + b[order[0]]);
                }
            }

            return super.respondWith({
                peers: super.toCollection(request, peers.map(peer => peer.toBroadcastInfo()), "peer"),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const peers = await this.p2p.getPeers();
            if (!peers) {
                return super.respondWith("No peers found", true);
            }

            const peer = peers.find(
                // @ts-ignore
                elem => elem.ip === request.query.ip && +elem.port === +request.query.port,
            );

            if (!peer) {
                return super.respondWith(
                    // @ts-ignore
                    `Peer ${request.query.ip}:${request.query.port} not found`,
                    true,
                );
            }

            return super.respondWith({
                peer: super.toResource(request, peer.toBroadcastInfo(), "peer"),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async version(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return super.respondWith({
                version: app.getVersion(),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
