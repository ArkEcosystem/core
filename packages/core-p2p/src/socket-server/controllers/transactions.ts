import { Container, Contracts } from "@arkecosystem/core-kernel";
import Hapi from "@hapi/hapi";

import { Controller } from "./controller";

export class TransactionsController extends Controller {
    public async postTransactions(request: Hapi.Request, h: Hapi.ResponseToolkit): Promise<string[]> {
        const createProcessor: Contracts.TransactionPool.ProcessorFactory = this.app.get(
            Container.Identifiers.TransactionPoolProcessorFactory,
        );
        const processor: Contracts.TransactionPool.Processor = createProcessor();
        await processor.process((request.payload as any).transactions as Buffer[]);
        return processor.accept;
    }
}
