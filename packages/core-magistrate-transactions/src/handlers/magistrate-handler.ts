import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";

export abstract class MagistrateTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        const milestone = Managers.configManager.getMilestone();
        return milestone.aip11 === true && !milestone.aip36;
    }
}
