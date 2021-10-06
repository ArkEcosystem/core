import { Contracts } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";

import { Controller } from "./controller";

export class ConsensusController extends Controller {
    public async createBlockProposal(
        request: Hapi.Request,
        h: Hapi.ResponseToolkit,
    ): Promise<Contracts.P2P.CreateBlockProposalResponse> {
        // @ts-ignore
        const {
            height,
            generatorPublicKey,
            payload,
            blockHash,
            signature,
            timestamp,
        }: Contracts.P2P.CreateBlockProposalRequest = request.payload;

        return { status: true };
    }
}
