import { roundCalculator } from "@arkecosystem/core-utils";
import { Crypto } from "@arkecosystem/crypto";
import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class DelegatesController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.delegates.index(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.delegates.show(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async count(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.delegates.count(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.delegates.search(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async voters(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v1.delegates.voters(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async fee(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            return super.respondWith({
                fee: this.config.getMilestone(this.blockchain.getLastHeight()).fees.staticFees.delegateRegistration,
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async forged(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const wallet = this.databaseService.walletManager.findByPublicKey(
                // @ts-ignore
                request.query.generatorPublicKey,
            );

            return super.respondWith({
                fees: Number(wallet.forgedFees),
                rewards: Number(wallet.forgedRewards),
                forged: Number(wallet.forgedFees) + Number(wallet.forgedRewards),
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async nextForgers(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            // @ts-ignore
            const limit = request.query.limit || 10;

            const delegatesCount = this.config.getMilestone(lastBlock).activeDelegates;
            const currentSlot = Crypto.slots.getSlotNumber(lastBlock.data.timestamp);

            const roundInfo = roundCalculator.calculateRound(lastBlock.data.height);
            const activeDelegates = await this.databaseService.getActiveDelegates(roundInfo);
            const nextForgers = [];

            for (let i = 1; i <= delegatesCount && i <= limit; i++) {
                const delegate = activeDelegates[(currentSlot + i) % delegatesCount];

                if (delegate) {
                    nextForgers.push(delegate.publicKey);
                }
            }

            return super.respondWith({
                currentBlock: lastBlock.data.height,
                currentSlot,
                delegates: nextForgers,
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
