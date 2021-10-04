import Hapi from "@hapi/hapi";

import { Controller } from "./controller";

export class ConsensusController extends Controller {
    public async createBlockProposal(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<boolean> {
        // @ts-ignore
        const { blockNumber, generatorPublicKey, payload, blockHash, signature, timestamp } = request.payload as Record<
            string,
            any
        >;

        return true;
    }
}
