import { blocksSchemas } from "../schemas/blocks";
import { Route, RouteConfig } from "./route";
import { BlocksController } from "../controllers/blocks";

export class BlocksRoute extends Route {
    public getRoutesConfigByPath(): { [path: string]: RouteConfig } {
        const controller = this.getController();
        return {
            "/p2p/blocks/getBlocks": {
                id: "p2p.blocks.getBlocks",
                handler: controller.getBlocks,
                validation: blocksSchemas.getBlocks,
            },
            "/p2p/blocks/postBlock": {
                id: "p2p.blocks.postBlock",
                handler: controller.postBlock,
                validation: blocksSchemas.postBlock,
            },
        };
    }

    protected getController(): BlocksController {
        return this.app.resolve(BlocksController);
    }
}
