import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";

export class LoaderController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return { data: true };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();

            return super.respondWith({
                loaded: this.blockchain.isSynced(),
                now: lastBlock ? lastBlock.data.height : 0,
                blocksCount:
                    this.blockchain.p2p.getMonitor().getNetworkHeight() - (lastBlock ? lastBlock.data.height : 0),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async syncing(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();

            return super.respondWith({
                syncing: !this.blockchain.isSynced(),
                blocks: this.blockchain.p2p.getMonitor().getNetworkHeight() - lastBlock.data.height,
                height: lastBlock.data.height,
                id: lastBlock.data.id,
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async autoconfigure(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const network = this.config.get("network");

            return super.respondWith({
                network: {
                    nethash: network.nethash,
                    token: network.client.token,
                    symbol: network.client.symbol,
                    explorer: network.client.explorer,
                    version: network.pubKeyHash,
                    ports: super.toResource(request, this.config, "ports"),
                },
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
