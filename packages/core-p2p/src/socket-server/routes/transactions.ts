import { transactionsSchemas } from "../schemas/transactions";
import { Route, RouteConfig } from "./route";
import { TransactionsController } from "../controllers/transactions";
import { constants } from "../../constants";

export class TransactionsRoute extends Route {
    public getRoutesConfigByPath(): { [path: string]: RouteConfig } {
        const controller = this.getController();
        return {
            "/p2p/transactions/postTransactions": {
                id: "p2p.transactions.postTransactions",
                handler: controller.postTransactions,
                validation: transactionsSchemas.postTransactions,
                maxBytes: constants.DEFAULT_MAX_PAYLOAD,
            },
        };
    }

    protected getController(): TransactionsController {
        return this.app.resolve(TransactionsController);
    }
}
