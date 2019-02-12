import { supplyCalculator } from "@arkecosystem/core-utils";
import { bignumify } from "@arkecosystem/core-utils";
import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class BlocksController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.blocks.index(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.blocks.show(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async epoch(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return super.respondWith({
                epoch: this.config.getMilestone(this.blockchain.getLastHeight()).epoch,
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async height(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const block = this.blockchain.getLastBlock();

            return super.respondWith({ height: block.data.height, id: block.data.id });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async nethash(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return super.respondWith({ nethash: this.config.get("network.nethash") });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async fee(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return super.respondWith({
                fee: this.config.getMilestone(this.blockchain.getLastHeight()).fees.staticFees.transfer,
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async fees(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastHeight = this.blockchain.getLastHeight();
            const fees = this.config.getMilestone(lastHeight).fees.staticFees;

            return super.respondWith({
                fees: {
                    send: fees.transfer,
                    vote: fees.vote,
                    secondsignature: fees.secondSignature,
                    delegate: fees.delegateRegistration,
                    multisignature: fees.multiSignature,
                },
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async milestone(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return super.respondWith({
                milestone: Math.floor(this.blockchain.getLastHeight() / 3000000),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async reward(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return super.respondWith({
                reward: this.config.getMilestone(this.blockchain.getLastHeight()).reward,
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async supply(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return super.respondWith({
                supply: supplyCalculator.calculate(this.blockchain.getLastBlock().data.height),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            const constants = this.config.getMilestone(lastBlock.data.height);
            const rewards = bignumify(constants.reward).times(lastBlock.data.height - constants.height);

            return super.respondWith({
                epoch: constants.epoch,
                height: lastBlock.data.height,
                fee: constants.fees.staticFees.transfer,
                milestone: Math.floor(lastBlock.data.height / 3000000),
                nethash: this.config.get("network.nethash"),
                reward: constants.reward,
                supply: +bignumify(this.config.get("genesisBlock.totalAmount"))
                    .plus(rewards)
                    .toFixed(),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
