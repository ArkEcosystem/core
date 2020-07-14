import { transactionsSchemas } from "../schemas/transactions";
import { Route, RouteConfig } from "./route";
import { TransactionsController } from "../controllers/transactions";

export class TransactionsRoute extends Route {
    public getRoutesConfigByPath(): { [path: string]: RouteConfig } {
        const controller = this.getController();
        return {
            "/p2p/transactions/postTransactions": {
                id: "p2p.transactions.postTransactions",
                handler: controller.postTransactions,
                validation: transactionsSchemas.postTransactions,
            },
        };
    }

    protected getController(): TransactionsController {
        return this.app.resolve(TransactionsController);
    }
}
