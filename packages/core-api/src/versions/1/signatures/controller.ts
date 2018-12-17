import { app } from "@arkecosystem/core-container";
import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class SignaturesController extends Controller {
    protected blockchain: any;
    protected config: any;

    public constructor() {
        super();

        this.blockchain = app.resolvePlugin("blockchain");
        this.config = app.getConfig();
    }

    public async fee(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const height: number = this.blockchain.getLastHeight();

            return super.respondWith({
                fee: this.config.getMilestone(height).fees.staticFees.secondSignature,
            });
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
