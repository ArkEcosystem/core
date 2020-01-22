import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";

export abstract class MagistrateTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }
}
