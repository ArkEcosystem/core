import { Handlers } from "@arkecosystem/core-transactions";
export declare abstract class MagistrateTransactionHandler extends Handlers.TransactionHandler {
    isActivated(): Promise<boolean>;
}
