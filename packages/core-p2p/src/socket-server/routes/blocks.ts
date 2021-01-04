import { constants } from "../../constants";
import { getBlocks, postBlock } from "../codecs/blocks";
import { BlocksController } from "../controllers/blocks";
import { blocksSchemas } from "../schemas/blocks";
import { Route, RouteConfig } from "./route";

export class BlocksRoute extends Route {
    public getRoutesConfigByPath(): { [path: string]: RouteConfig } {
        const controller = this.getController();
        return {
            "/p2p/blocks/getBlocks": {
                id: "p2p.blocks.getBlocks",
                handler: controller.getBlocks,
                validation: blocksSchemas.getBlocks,
                codec: getBlocks,
                maxBytes: 1024,
            },
            "/p2p/blocks/postBlock": {
                id: "p2p.blocks.postBlock",
                handler: controller.postBlock,
                validation: blocksSchemas.postBlock,
                codec: postBlock,
                maxBytes: constants.DEFAULT_MAX_PAYLOAD,
            },
        };
    }

    protected getController(): BlocksController {
        return this.app.resolve(BlocksController);
    }
}
