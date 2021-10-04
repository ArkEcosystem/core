import { createBlockProposal } from "../codecs/consensus";
import { ConsensusController } from "../controllers/consensus";
import { consensusSchemas } from "../schemas/consensus";
import { Route, RouteConfig } from "./route";

export class ConsensusRoute extends Route {
    public getRoutesConfigByPath(): { [path: string]: RouteConfig } {
        const controller = this.getController();
        return {
            "/p2p/consensus/createBlockProposal": {
                id: "p2p.consensus.createBlockProposal",
                handler: controller.createBlockProposal,
                validation: consensusSchemas.createBlockProposal,
                codec: createBlockProposal,
                maxBytes: 1024,
            },
        };
    }

    protected getController(): ConsensusController {
        return this.app.resolve(ConsensusController);
    }
}
